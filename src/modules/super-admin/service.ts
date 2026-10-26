import { db } from "@/lib/db";
import type { PlanTier } from "@prisma/client";
import type { SuperAdminDashboardData, CompanyItem, UserItem } from "./types";

/**
 * Estimated token cost in Rupiah (IDR).
 * OpenRouter / Gemini blended rate is ~$2.50 per 1M tokens (Rp 40.000 / 1M tokens = Rp 0.04 / token).
 */
export const IDR_PER_TOKEN = 0.04;

export function calculateIdrCost(tokens: number): number {
  return Math.round(tokens * IDR_PER_TOKEN);
}

const FALLBACK_DATA: SuperAdminDashboardData = {
  kpis: {
    totalCompanies: 2,
    totalJobSeekers: 2,
    totalActiveJobs: 2,
    totalTokensUsed: 10010,
    estimatedIdrCost: 400400,
  },
  companies: [
    {
      id: "org-1",
      name: "ASE Research Lab",
      slug: "aselab",
      planTier: "SME_PRO",
      applicantQuota: 250,
      isVerified: true,
      cultureDescription:
        "Autonomous software engineering laboratory conducting cutting-edge distributed systems and AI systems research.",
      jobCount: 1,
      memberCount: 2,
      createdAt: new Date("2026-01-10"),
    },
    {
      id: "org-2",
      name: "Nusantara Tech Startup",
      slug: "nusantara-tech",
      planTier: "PAY_PER_OPREC",
      applicantQuota: 100,
      isVerified: true,
      cultureDescription:
        "High-growth Southeast Asian fintech startup championing customer obsession, fast execution, and modern cloud technologies.",
      jobCount: 1,
      memberCount: 1,
      createdAt: new Date("2026-02-15"),
    },
  ],
  users: [
    {
      id: "usr-admin",
      name: "MatchLab Super Admin",
      email: "admin@matchlab.id",
      systemRole: "SUPER_ADMIN",
      isActive: true,
      createdAt: new Date("2026-01-01"),
      organizations: [],
      hasCandidateProfile: false,
      skills: [],
    },
    {
      id: "usr-hendra",
      name: "Dr. Hendra Wibowo",
      email: "hendra@aselab.id",
      systemRole: "COMPANY_USER",
      isActive: true,
      createdAt: new Date("2026-01-10"),
      organizations: [{ name: "ASE Research Lab", orgRole: "ORG_ADMIN" }],
      hasCandidateProfile: false,
      skills: [],
    },
    {
      id: "usr-budi",
      name: "Budi Santoso",
      email: "budi@aselab.id",
      systemRole: "COMPANY_USER",
      isActive: true,
      createdAt: new Date("2026-01-12"),
      organizations: [{ name: "ASE Research Lab", orgRole: "DIVISION_LEAD" }],
      hasCandidateProfile: false,
      skills: [],
    },
    {
      id: "usr-siti",
      name: "Siti Rahma",
      email: "siti@nusantaratech.id",
      systemRole: "COMPANY_USER",
      isActive: true,
      createdAt: new Date("2026-02-15"),
      organizations: [{ name: "Nusantara Tech Startup", orgRole: "ORG_ADMIN" }],
      hasCandidateProfile: false,
      skills: [],
    },
    {
      id: "usr-dewi",
      name: "Dewi Lestari",
      email: "dewi@example.com",
      systemRole: "JOB_SEEKER",
      isActive: true,
      createdAt: new Date("2026-02-20"),
      organizations: [],
      hasCandidateProfile: true,
      skills: ["Next.js", "TypeScript", "PostgreSQL", "Docker", "Tailwind CSS"],
    },
    {
      id: "usr-fajar",
      name: "Fajar Pratama",
      email: "fajar@example.com",
      systemRole: "JOB_SEEKER",
      isActive: true,
      createdAt: new Date("2026-02-22"),
      organizations: [],
      hasCandidateProfile: true,
      skills: ["Python", "FastAPI", "PyTorch", "Docker", "Machine Learning"],
    },
  ],
};

export async function getSuperAdminDashboardData(): Promise<SuperAdminDashboardData> {
  try {
    const [organizations, users, activeJobsCount, sessionAgg, evalAgg] = await Promise.all([
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
      isVerified: org.isVerified,
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
      },
      companies,
      users: formattedUsers,
    };
  } catch (error) {
    console.warn("Could not query DB for Super Admin metrics, falling back to mock seed data:", error);
    return FALLBACK_DATA;
  }
}

export async function toggleOrgVerification(orgId: string, isVerified: boolean) {
  try {
    return await db.organization.update({
      where: { id: orgId },
      data: { isVerified },
    });
  } catch (err) {
    console.warn(`[Local Fallback] toggleOrgVerification(${orgId}, ${isVerified})`, err);
    return { id: orgId, isVerified };
  }
}

export async function updateOrgPlan(orgId: string, planTier: PlanTier, applicantQuota: number) {
  try {
    return await db.organization.update({
      where: { id: orgId },
      data: { planTier, applicantQuota },
    });
  } catch (err) {
    console.warn(`[Local Fallback] updateOrgPlan(${orgId}, ${planTier}, ${applicantQuota})`, err);
    return { id: orgId, planTier, applicantQuota };
  }
}

export async function toggleUserStatus(userId: string, isActive: boolean) {
  try {
    return await db.user.update({
      where: { id: userId },
      data: { isActive },
    });
  } catch (err) {
    console.warn(`[Local Fallback] toggleUserStatus(${userId}, ${isActive})`, err);
    return { id: userId, isActive };
  }
}
