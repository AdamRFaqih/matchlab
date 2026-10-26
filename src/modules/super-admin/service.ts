import { db } from "@/lib/db";
import type { PlanTier } from "@prisma/client";
import { recordAudit, AuditAction } from "@/lib/audit";
import { revokeAllUserSessions } from "@/lib/auth/session";
import type { SuperAdminDashboardData, CompanyItem, UserItem } from "./types";

/**
 * Estimated token cost in Rupiah (IDR).
 * OpenRouter / Gemini blended rate is ~$2.50 per 1M tokens (Rp 40.000 / 1M tokens = Rp 0.04 / token).
 */
export const IDR_PER_TOKEN = 0.04;

export function calculateIdrCost(tokens: number): number {
  return Math.round(tokens * IDR_PER_TOKEN);
}

export async function getSuperAdminDashboardData(): Promise<SuperAdminDashboardData> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    organizations,
    users,
    activeJobsCount,
    sessionAgg,
    evalAgg,
    paidInvoicesAgg,
    paidThisMonthAgg,
    payingOrgsCount,
  ] = await Promise.all([
    db.organization.findMany({
      include: {
        _count: {
          select: {
            jobs: true,
            members: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.user.findMany({
      include: {
        memberships: {
          include: {
            organization: {
              select: { name: true },
            },
          },
        },
        candidateProfile: {
          select: { skills: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.jobRequisition.count({
      where: { isActive: true },
    }),
    db.interviewSession.aggregate({
      _sum: { totalTokensUsed: true },
    }),
    db.evaluation.aggregate({
      _sum: { evalTokensUsed: true },
    }),
    db.invoice.aggregate({
      where: { status: "PAID" },
      _sum: { amount: true },
    }),
    db.invoice.aggregate({
      where: {
        status: "PAID",
        paidAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    }),
    db.organization.count({
      where: { planTier: { not: "FREE" } },
    }),
  ]);

  const totalSessionTokens = sessionAgg._sum.totalTokensUsed || 0;
  const totalEvalTokens = evalAgg._sum.evalTokensUsed || 0;
  const totalTokensUsed = totalSessionTokens + totalEvalTokens;

  const totalJobSeekers = users.filter((u) => u.systemRole === "JOB_SEEKER").length;

  const companies: CompanyItem[] = organizations.map((org) => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    planTier: org.planTier,
    applicantQuota: org.applicantQuota,
    applicantsUsed: org.applicantsUsed,
    isVerified: org.isVerified,
    isSuspended: org.isSuspended,
    currentPeriodEnd: org.currentPeriodEnd,
    cultureDescription: org.cultureDescription,
    jobCount: org._count.jobs,
    memberCount: org._count.members,
    createdAt: org.createdAt,
  }));

  const formattedUsers: UserItem[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    systemRole: u.systemRole,
    isActive: u.isActive,
    emailVerified: Boolean(u.emailVerifiedAt),
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt,
    organizations: u.memberships.map((m) => ({
      name: m.organization.name,
      orgRole: m.orgRole,
    })),
    hasCandidateProfile: !!u.candidateProfile,
    skills: u.candidateProfile?.skills || [],
  }));

  return {
    kpis: {
      totalCompanies: organizations.length,
      totalJobSeekers,
      totalActiveJobs: activeJobsCount,
      totalTokensUsed,
      estimatedIdrCost: calculateIdrCost(totalTokensUsed),
      totalRevenueIdr: paidInvoicesAgg._sum.amount || 0,
      revenueThisMonthIdr: paidThisMonthAgg._sum.amount || 0,
      payingOrgsCount,
    },
    companies,
    users: formattedUsers,
  };
}

export async function toggleOrgVerification(
  orgId: string,
  isVerified: boolean,
  actor: { id: string; email: string }
) {
  const updated = await db.organization.update({
    where: { id: orgId },
    data: { isVerified },
  });

  await recordAudit({
    action: AuditAction.ORG_VERIFIED,
    actorId: actor.id,
    actorEmail: actor.email,
    organizationId: orgId,
    targetType: "Organization",
    targetId: orgId,
    metadata: { isVerified },
  });

  return updated;
}

export async function toggleOrgSuspension(
  orgId: string,
  isSuspended: boolean,
  actor: { id: string; email: string }
) {
  const updated = await db.organization.update({
    where: { id: orgId },
    data: { isSuspended },
  });

  await recordAudit({
    action: AuditAction.ORG_SUSPENDED,
    actorId: actor.id,
    actorEmail: actor.email,
    organizationId: orgId,
    targetType: "Organization",
    targetId: orgId,
    metadata: { isSuspended },
  });

  return updated;
}

export async function updateOrgPlan(
  orgId: string,
  planTier: PlanTier,
  applicantQuota: number,
  actor: { id: string; email: string },
  periodDays?: number
) {
  const data: { planTier: PlanTier; applicantQuota: number; currentPeriodEnd?: Date } = {
    planTier,
    applicantQuota,
  };

  if (planTier === "SME_PRO") {
    const days = periodDays ?? 30;
    data.currentPeriodEnd = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  const updated = await db.organization.update({
    where: { id: orgId },
    data,
  });

  await recordAudit({
    action: AuditAction.ORG_PLAN_CHANGED,
    actorId: actor.id,
    actorEmail: actor.email,
    organizationId: orgId,
    targetType: "Organization",
    targetId: orgId,
    metadata: { planTier, applicantQuota, currentPeriodEnd: data.currentPeriodEnd },
  });

  return updated;
}

export async function updateOrgQuota(
  orgId: string,
  applicantQuota: number,
  actor: { id: string; email: string }
) {
  const updated = await db.organization.update({
    where: { id: orgId },
    data: { applicantQuota },
  });

  await recordAudit({
    action: AuditAction.ORG_QUOTA_CHANGED,
    actorId: actor.id,
    actorEmail: actor.email,
    organizationId: orgId,
    targetType: "Organization",
    targetId: orgId,
    metadata: { applicantQuota },
  });

  return updated;
}

export async function toggleUserStatus(
  userId: string,
  isActive: boolean,
  actor: { id: string; email: string }
) {
  const targetUser = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, email: true, systemRole: true },
  });

  if (targetUser.id === actor.id) {
    throw new Error("Anda tidak dapat menonaktifkan akun Anda sendiri.");
  }

  if (targetUser.systemRole === "SUPER_ADMIN") {
    throw new Error("Akun Super Admin lain tidak dapat dinonaktifkan.");
  }

  const updated = await db.user.update({
    where: { id: userId },
    data: { isActive },
  });

  // If deactivated, immediately revoke all active sessions of this user
  if (!isActive) {
    await revokeAllUserSessions(userId);
  }

  await recordAudit({
    action: AuditAction.USER_STATUS_CHANGED,
    actorId: actor.id,
    actorEmail: actor.email,
    targetType: "User",
    targetId: userId,
    metadata: { isActive, targetEmail: targetUser.email },
  });

  return updated;
}
