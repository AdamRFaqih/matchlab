import { db } from "@/lib/db";
import type { ApplicationStatus, Prisma } from "@prisma/client";
import type { CandidateEvaluation } from "@/lib/ai/schemas";

export async function saveEvaluationRecord(
  candidateId: string,
  evaluation: CandidateEvaluation
) {
  const traitBreakdownJson = evaluation.traitBreakdown as unknown as Prisma.InputJsonValue;

  return await db.$transaction(async (tx) => {
    const savedEval = await tx.evaluation.upsert({
      where: { candidateId },
      create: {
        candidateId,
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

    // Update candidate status to EVALUATED if not already SHORTLISTED or REJECTED
    const candidate = await tx.candidate.findUnique({
      where: { id: candidateId },
      select: { status: true },
    });

    if (
      candidate &&
      candidate.status !== "SHORTLISTED" &&
      candidate.status !== "REJECTED"
    ) {
      await tx.candidate.update({
        where: { id: candidateId },
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
      candidates: {
        include: {
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

export async function getCandidateForEvaluation(candidateId: string) {
  return await db.candidate.findUnique({
    where: { id: candidateId },
    include: {
      job: true,
      session: true,
      evaluation: true,
    },
  });
}

export async function updateCandidateApplicationStatus(
  candidateId: string,
  status: ApplicationStatus
) {
  return await db.candidate.update({
    where: { id: candidateId },
    data: { status },
  });
}
