import { db } from "@/lib/db";
import { summarizeQuota } from "@/lib/billing/quota";
import { recordAudit, AuditAction } from "@/lib/audit";
import type { OrganizationDashboardData } from "./types";

export async function getOrganizationDashboardData(
  targetOrgId: string,
  userOrgRole?: string
): Promise<OrganizationDashboardData | null> {
  const org = await db.organization.findUnique({
    where: { id: targetOrgId },
  });

  if (!org) {
    return null;
  }

  // Query jobs strictly for this organization (strict tenant isolation)
  const jobsRaw = await db.jobRequisition.findMany({
    where: { organizationId: org.id },
    include: {
      applications: {
        select: {
          id: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const jobs = jobsRaw.map((job) => {
    const totalApplicants = job.applications.length;
    const evaluatedCount = job.applications.filter(
      (a) => a.status === "EVALUATED" || a.status === "SHORTLISTED"
    ).length;
    const shortlistedCount = job.applications.filter(
      (a) => a.status === "SHORTLISTED"
    ).length;

    return {
      id: job.id,
      title: job.title,
      slug: job.slug,
      maxTurns: job.maxTurns,
      isActive: job.isActive,
      createdAt: job.createdAt,
      totalApplicants,
      evaluatedCount,
      shortlistedCount,
    };
  });

  const quotaSummary = summarizeQuota(org);

  return {
    organization: {
      id: org.id,
      name: org.name,
      slug: org.slug,
      planTier: org.planTier,
      applicantQuota: org.applicantQuota,
      applicantsUsed: org.applicantsUsed,
      billingEmail: org.billingEmail,
      cultureDescription: org.cultureDescription,
      isVerified: org.isVerified,
      isSuspended: org.isSuspended,
      currentPeriodEnd: org.currentPeriodEnd,
    },
    jobs,
    quota: {
      used: quotaSummary.used,
      total: quotaSummary.total,
      remaining: quotaSummary.remaining,
      percentage: quotaSummary.percentage,
      isExpired: quotaSummary.isExpired,
    },
    isOrgAdmin: userOrgRole === "ORG_ADMIN",
  };
}

export async function updateOrganizationSettings(params: {
  organizationId: string;
  actorId: string;
  actorEmail: string;
  name: string;
  billingEmail?: string;
  cultureDescription?: string;
}) {
  const updated = await db.organization.update({
    where: { id: params.organizationId },
    data: {
      name: params.name,
      billingEmail: params.billingEmail ? params.billingEmail.trim().toLowerCase() : null,
      cultureDescription: params.cultureDescription ? params.cultureDescription.trim() : null,
    },
  });

  await recordAudit({
    action: AuditAction.ORG_UPDATED,
    actorId: params.actorId,
    actorEmail: params.actorEmail,
    organizationId: params.organizationId,
    targetType: "Organization",
    targetId: params.organizationId,
    metadata: {
      name: updated.name,
      billingEmail: updated.billingEmail,
    },
  });

  return updated;
}
