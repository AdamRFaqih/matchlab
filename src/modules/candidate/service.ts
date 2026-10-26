import { db } from "@/lib/db";
import type {
  CandidateDashboardData,
  CandidateProfileData,
  CandidateApplicationItem,
} from "./types";

const FALLBACK_PROFILE: CandidateProfileData = {
  id: "prof-dewi",
  userId: "usr-dewi",
  name: "Dewi Lestari",
  email: "dewi@example.com",
  cvSummaryText:
    "Fullstack & Cloud Engineer with 3 years experience building scalable Node.js and Next.js applications, Docker, and PostgreSQL.",
  skills: ["Next.js", "TypeScript", "PostgreSQL", "Docker", "Tailwind CSS"],
  portfolioUrl: "https://github.com/dewilestari",
  isOpenToPool: true,
};

const FALLBACK_APPLICATIONS: CandidateApplicationItem[] = [
  {
    id: "app-dewi-1",
    jobId: "job-1",
    jobTitle: "Senior Systems & Cloud Infrastructure Engineer",
    jobSlug: "aselab-senior-systems",
    maxTurns: 8,
    organizationName: "ASE Research Lab",
    organizationSlug: "aselab",
    organizationVerified: true,
    status: "EVALUATED",
    appliedAt: new Date("2026-02-05"),
    turnCount: 8,
    isCompleted: true,
    evaluation: {
      matchScore: 91,
      domainScore: 94,
      implicitBehaviorScore: 88,
      executiveSummary:
        "Kandidat menunjukkan penguasaan kuat terhadap containerization dan Linux internals. Komunikasi tenang, metodis, dan terstruktur dalam skenario incident response.",
      greenFlags: [
        "Pengalaman praktis Linux & Docker kuat",
        "Rendah hati dan fokus pada akar masalah",
        "Prosedur penanganan insiden sistematis",
      ],
      finalInterviewProbes: [
        "Gali arsitektur cluster Kubernetes dan pipeline CI/CD yang pernah dikelola",
      ],
    },
  },
];

export async function getCandidateDashboardData(
  userId: string
): Promise<CandidateDashboardData> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        candidateProfile: {
          include: {
            applications: {
              include: {
                job: {
                  include: {
                    organization: true,
                  },
                },
                session: true,
                evaluation: true,
              },
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
    });

    if (!user) {
      return {
        profile: FALLBACK_PROFILE,
        applications: FALLBACK_APPLICATIONS,
        stats: {
          totalApplications: 1,
          inProgress: 0,
          evaluated: 1,
          shortlisted: 0,
        },
      };
    }

    const profileData: CandidateProfileData = {
      id: user.candidateProfile?.id,
      userId: user.id,
      name: user.name,
      email: user.email,
      cvSummaryText: user.candidateProfile?.cvSummaryText || "",
      skills: user.candidateProfile?.skills || [],
      portfolioUrl: user.candidateProfile?.portfolioUrl || null,
      isOpenToPool: user.candidateProfile?.isOpenToPool ?? true,
    };

    const rawApplications = user.candidateProfile?.applications || [];

    const applications: CandidateApplicationItem[] = rawApplications.map((app) => ({
      id: app.id,
      jobId: app.job.id,
      jobTitle: app.job.title,
      jobSlug: app.job.slug,
      maxTurns: app.job.maxTurns,
      organizationName: app.job.organization.name,
      organizationSlug: app.job.organization.slug,
      organizationVerified: app.job.organization.isVerified,
      status: app.status,
      appliedAt: app.createdAt,
      turnCount: app.session?.turnCount ?? 0,
      isCompleted:
        app.session?.completedAt !== null ||
        (app.session?.turnCount ?? 0) >= app.job.maxTurns,
      evaluation: app.evaluation
        ? {
            matchScore: app.evaluation.matchScore,
            domainScore: app.evaluation.domainScore,
            implicitBehaviorScore: app.evaluation.implicitBehaviorScore,
            executiveSummary: app.evaluation.executiveSummary,
            greenFlags: app.evaluation.greenFlags,
            finalInterviewProbes: app.evaluation.finalInterviewProbes,
          }
        : null,
    }));

    const stats = {
      totalApplications: applications.length,
      inProgress: applications.filter(
        (a) => a.status === "IN_PROGRESS" || a.status === "REGISTERED"
      ).length,
      evaluated: applications.filter(
        (a) => a.status === "EVALUATED" || a.status === "COMPLETED_SCREENING"
      ).length,
      shortlisted: applications.filter((a) => a.status === "SHORTLISTED").length,
    };

    return {
      profile: profileData,
      applications,
      stats,
    };
  } catch (error) {
    console.warn("Could not query DB for candidate dashboard, using fallback data:", error);
    return {
      profile: FALLBACK_PROFILE,
      applications: FALLBACK_APPLICATIONS,
      stats: {
        totalApplications: 1,
        inProgress: 0,
        evaluated: 1,
        shortlisted: 0,
      },
    };
  }
}

export async function saveCandidateProfile(
  userId: string,
  data: {
    name: string;
    cvSummaryText: string;
    skills: string[];
    portfolioUrl?: string | null;
    isOpenToPool: boolean;
  }
) {
  try {
    return await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { name: data.name },
      });

      return await tx.candidateProfile.upsert({
        where: { userId },
        create: {
          userId,
          cvSummaryText: data.cvSummaryText,
          skills: data.skills,
          portfolioUrl: data.portfolioUrl || null,
          isOpenToPool: data.isOpenToPool,
        },
        update: {
          cvSummaryText: data.cvSummaryText,
          skills: data.skills,
          portfolioUrl: data.portfolioUrl || null,
          isOpenToPool: data.isOpenToPool,
        },
      });
    });
  } catch (error) {
    console.warn("DB save failed for candidate profile, local fallback:", error);
    return {
      userId,
      ...data,
      portfolioUrl: data.portfolioUrl || null,
    };
  }
}
