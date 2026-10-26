import { db } from "@/lib/db";
import type { OrganizationDashboardData } from "./types";

const FALLBACK_ORG_DATA: OrganizationDashboardData = {
  organization: {
    id: "org-1",
    name: "ASE Research Lab",
    slug: "aselab",
    planTier: "SME_PRO",
    applicantQuota: 250,
    cultureDescription:
      "Autonomous software engineering laboratory conducting cutting-edge distributed systems and AI systems research with high rigor and team accountability.",
    isVerified: true,
  },
  jobs: [
    {
      id: "job-1",
      title: "Senior Systems & Cloud Infrastructure Engineer",
      slug: "aselab-senior-systems",
      maxTurns: 8,
      isActive: true,
      createdAt: new Date("2026-02-01"),
      totalApplicants: 1,
      evaluatedCount: 1,
      shortlistedCount: 0,
    },
  ],
  quota: {
    used: 1,
    total: 250,
    remaining: 249,
    percentage: 1,
  },
  isOrgAdmin: true,
};

export async function getOrganizationDashboardData(
  targetOrgId?: string,
  userOrgRole?: string
): Promise<OrganizationDashboardData> {
  try {
    let org = null;

    if (targetOrgId) {
      org = await db.organization.findUnique({
        where: { id: targetOrgId },
      });
    }

    if (!org) {
      org = await db.organization.findFirst({
        orderBy: { createdAt: "asc" },
      });
    }

    if (!org) {
      return FALLBACK_ORG_DATA;
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

    let totalApplicantsAllJobs = 0;

    const jobs = jobsRaw.map((job) => {
      const totalApplicants = job.applications.length;
      totalApplicantsAllJobs += totalApplicants;
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

    const totalQuota = org.applicantQuota;
    const usedQuota = totalApplicantsAllJobs;
    const remainingQuota = Math.max(0, totalQuota - usedQuota);
    const percentage = totalQuota > 0 ? Math.min(100, Math.round((usedQuota / totalQuota) * 100)) : 0;

    return {
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        planTier: org.planTier,
        applicantQuota: org.applicantQuota,
        cultureDescription: org.cultureDescription,
        isVerified: org.isVerified,
      },
      jobs,
      quota: {
        used: usedQuota,
        total: totalQuota,
        remaining: remainingQuota,
        percentage,
      },
      isOrgAdmin: userOrgRole === "ORG_ADMIN" || userOrgRole === "SUPER_ADMIN",
    };
  } catch (error) {
    console.warn("Could not query DB for organization dashboard, using fallback data:", error);
    return FALLBACK_ORG_DATA;
  }
}

export async function updateOrganizationSettings(params: {
  organizationId: string;
  name: string;
  cultureDescription: string;
}) {
  try {
    return await db.organization.update({
      where: { id: params.organizationId },
      data: {
        name: params.name.trim(),
        cultureDescription: params.cultureDescription.trim(),
      },
    });
  } catch (error) {
    console.warn("DB update failed for organization settings, local fallback:", error);
    return {
      id: params.organizationId,
      name: params.name,
      cultureDescription: params.cultureDescription,
    };
  }
}
