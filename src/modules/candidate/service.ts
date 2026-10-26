import { db } from "@/lib/db";
import type {
  CandidateDashboardData,
  CandidateProfileData,
  CandidateApplicationItem,
} from "./types";

export async function getCandidateDashboardData(
  userId: string
): Promise<CandidateDashboardData> {
  const user = await db.user.findUniqueOrThrow({
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
}
