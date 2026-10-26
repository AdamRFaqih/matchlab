import { db } from "@/lib/db";
import type { ApplicationStatus, Prisma } from "@prisma/client";
import type { CandidateEvaluation } from "@/lib/ai/schemas";

export async function saveEvaluationRecord(
  applicationId: string,
  evaluation: CandidateEvaluation
) {
  const traitBreakdownJson = evaluation.traitBreakdown as unknown as Prisma.InputJsonValue;

  return await db.$transaction(async (tx) => {
    const savedEval = await tx.evaluation.upsert({
      where: { applicationId },
      create: {
        applicationId,
        matchScore: evaluation.matchScore,
        domainScore: evaluation.domainScore,
        implicitBehaviorScore: evaluation.implicitBehaviorScore,
        executiveSummary: evaluation.executiveSummary,
        traitBreakdown: traitBreakdownJson,
        greenFlags: evaluation.greenFlags,
        redFlags: evaluation.redFlags,
        finalInterviewProbes: evaluation.finalInterviewProbes,
      },
      update: {
        matchScore: evaluation.matchScore,
        domainScore: evaluation.domainScore,
        implicitBehaviorScore: evaluation.implicitBehaviorScore,
        executiveSummary: evaluation.executiveSummary,
        traitBreakdown: traitBreakdownJson,
        greenFlags: evaluation.greenFlags,
        redFlags: evaluation.redFlags,
        finalInterviewProbes: evaluation.finalInterviewProbes,
      },
    });

    // Update application status to EVALUATED if not already SHORTLISTED or REJECTED
    const application = await tx.jobApplication.findUnique({
      where: { id: applicationId },
      select: { status: true },
    });

    if (
      application &&
      application.status !== "SHORTLISTED" &&
      application.status !== "REJECTED"
    ) {
      await tx.jobApplication.update({
        where: { id: applicationId },
        data: { status: "EVALUATED" },
      });
    }

    return savedEval;
  });
}

export async function getJobWithLeaderboard(jobId: string) {
  return await db.jobRequisition.findUnique({
    where: { id: jobId },
    include: {
      organization: true,
      applications: {
        include: {
          candidateProfile: {
            include: {
              user: true,
            },
          },
          session: true,
          evaluation: true,
        },
        orderBy: [
          {
            evaluation: {
              matchScore: "desc",
            },
          },
          {
            createdAt: "desc",
          },
        ],
      },
    },
  });
}

export async function getCandidateForEvaluation(applicationId: string) {
  return await db.jobApplication.findUnique({
    where: { id: applicationId },
    include: {
      job: true,
      session: true,
      evaluation: true,
      candidateProfile: {
        include: {
          user: true,
        },
      },
    },
  });
}

export async function updateCandidateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus
) {
  return await db.jobApplication.update({
    where: { id: applicationId },
    data: { status },
  });
}
