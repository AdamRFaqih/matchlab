import "server-only";
import type { Organization, Prisma, PlanTier } from "@prisma/client";
import { db } from "@/lib/db";
import { recordAudit, AuditAction } from "@/lib/audit";
import { PLANS, getPlan } from "./plans";

/**
 * Quota & plan-limit enforcement.
 *
 * Model:
 *  - `applicantQuota` is the total allowance, `applicantsUsed` the consumed amount.
 *    remaining = applicantQuota - applicantsUsed.
 *  - FREE: one-time starter allowance.
 *  - PAY_PER_OPREC: each purchase adds credits; credits never expire.
 *  - SME_PRO: each payment adds a 30-day period + monthly allowance. Unused allowance rolls over
 *    while the subscription stays active. When the period ends without renewal the org is
 *    downgraded to FREE and the remaining allowance is forfeited.
 */

export type QuotaOrg = Pick<
  Organization,
  "id" | "planTier" | "applicantQuota" | "applicantsUsed" | "currentPeriodEnd" | "isSuspended"
>;

export interface QuotaSummary {
  planTier: PlanTier;
  planName: string;
  total: number;
  used: number;
  remaining: number;
  percentage: number;
  currentPeriodEnd: Date | null;
  isExpired: boolean;
  maxActiveJobs: number | null;
  maxMembers: number | null;
}

export function isSubscriptionExpired(org: Pick<Organization, "planTier" | "currentPeriodEnd">): boolean {
  return org.planTier === "SME_PRO" && (!org.currentPeriodEnd || org.currentPeriodEnd < new Date());
}

export function summarizeQuota(org: QuotaOrg): QuotaSummary {
  const plan = getPlan(org.planTier);
  const expired = isSubscriptionExpired(org);
  const remaining = expired ? 0 : Math.max(0, org.applicantQuota - org.applicantsUsed);
  return {
    planTier: org.planTier,
    planName: plan.name,
    total: org.applicantQuota,
    used: org.applicantsUsed,
    remaining,
    percentage:
      org.applicantQuota > 0
        ? Math.min(100, Math.round((org.applicantsUsed / org.applicantQuota) * 100))
        : 100,
    currentPeriodEnd: org.currentPeriodEnd,
    isExpired: expired,
    maxActiveJobs: plan.maxActiveJobs,
    maxMembers: plan.maxMembers,
  };
}

/**
 * Downgrades an organization whose SME_PRO period has lapsed. Idempotent; safe to call on
 * every dashboard load / before quota checks.
 */
export async function syncSubscriptionState(organizationId: string): Promise<void> {
  const res = await db.organization.updateMany({
    where: { id: organizationId, planTier: "SME_PRO", currentPeriodEnd: { lt: new Date() } },
    data: { planTier: "FREE" },
  });
  if (res.count > 0) {
    // Forfeit remaining allowance on lapse.
    await db.$executeRaw`UPDATE "Organization" SET "applicantQuota" = "applicantsUsed" WHERE id = ${organizationId}`;
    await recordAudit({
      action: AuditAction.ORG_PLAN_CHANGED,
      organizationId,
      metadata: { from: "SME_PRO", to: "FREE", reason: "subscription_expired" },
      ipAddress: null,
    });
  }
}

export async function getQuotaSummary(organizationId: string): Promise<QuotaSummary | null> {
  await syncSubscriptionState(organizationId);
  const org = await db.organization.findUnique({ where: { id: organizationId } });
  return org ? summarizeQuota(org) : null;
}

export class QuotaExceededError extends Error {
  constructor(message = "Kuota pelamar organisasi ini telah habis.") {
    super(message);
    this.name = "QuotaExceededError";
  }
}

/**
 * Atomically consumes one applicant slot. Must be called inside the same transaction that
 * creates the JobApplication so a failed insert does not burn quota.
 *
 * @throws QuotaExceededError when the organization has no remaining quota, is suspended,
 *         or its subscription has expired.
 */
export async function consumeApplicantQuota(
  tx: Prisma.TransactionClient,
  organizationId: string
): Promise<void> {
  const affected = await tx.$executeRaw`
    UPDATE "Organization"
    SET "applicantsUsed" = "applicantsUsed" + 1, "updatedAt" = NOW()
    WHERE id = ${organizationId}
      AND "isSuspended" = false
      AND "applicantsUsed" < "applicantQuota"
      AND ("planTier" <> 'SME_PRO' OR "currentPeriodEnd" > NOW())
  `;
  if (affected === 0) {
    throw new QuotaExceededError(
      "Lowongan ini sedang tidak menerima pelamar baru (kuota organisasi telah habis)."
    );
  }
}

/** Returns an error message if the org cannot have another active job under its plan. */
export async function checkActiveJobLimit(organizationId: string): Promise<string | null> {
  const org = await db.organization.findUnique({
    where: { id: organizationId },
    select: { planTier: true },
  });
  if (!org) return "Organisasi tidak ditemukan.";
  const limit = PLANS[org.planTier].maxActiveJobs;
  if (limit === null) return null;
  const active = await db.jobRequisition.count({ where: { organizationId, isActive: true } });
  return active >= limit
    ? `Paket ${PLANS[org.planTier].name} hanya mengizinkan ${limit} lowongan aktif. Nonaktifkan lowongan lain atau upgrade paket.`
    : null;
}

/** Returns an error message if the org cannot add another member (incl. pending invites). */
export async function checkMemberLimit(organizationId: string): Promise<string | null> {
  const org = await db.organization.findUnique({
    where: { id: organizationId },
    select: { planTier: true },
  });
  if (!org) return "Organisasi tidak ditemukan.";
  const limit = PLANS[org.planTier].maxMembers;
  if (limit === null) return null;
  const [members, pending] = await Promise.all([
    db.organizationMember.count({ where: { organizationId } }),
    db.organizationInvitation.count({
      where: { organizationId, acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
    }),
  ]);
  return members + pending >= limit
    ? `Paket ${PLANS[org.planTier].name} hanya mengizinkan ${limit} anggota tim. Upgrade paket untuk menambah anggota.`
    : null;
}
