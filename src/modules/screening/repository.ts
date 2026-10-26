import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { ChatMessage } from "./types";

export async function findJobForScreening(slug: string) {
  return await db.jobRequisition.findUnique({
    where: { slug, isActive: true },
    include: {
      organization: true,
    },
  });
}

export async function findCandidateWithSession(jobId: string, email: string) {
  return await db.candidate.findUnique({
    where: {
      jobId_email: {
        jobId,
        email: email.toLowerCase().trim(),
      },
    },
    include: {
      session: true,
      job: true,
    },
  });
}

export interface CreateCandidateParams {
  jobId: string;
  fullName: string;
  email: string;
  cvSummaryText: string;
  portfolioUrl?: string;
  clientIp?: string;
  initialMessage: ChatMessage;
}

export async function createCandidateAndSession(params: CreateCandidateParams) {
  const initialMessagesJson: Prisma.InputJsonValue = [
    {
      id: params.initialMessage.id,
      role: params.initialMessage.role,
      content: params.initialMessage.content,
      timestamp: params.initialMessage.timestamp,
    },
  ];

  return await db.$transaction(async (tx) => {
    const candidate = await tx.candidate.create({
      data: {
        jobId: params.jobId,
        fullName: params.fullName.trim(),
        email: params.email.toLowerCase().trim(),
        cvSummaryText: params.cvSummaryText.trim(),
        portfolioUrl: params.portfolioUrl?.trim() || null,
        clientIp: params.clientIp || null,
        status: "IN_PROGRESS",
      },
    });

    const session = await tx.interviewSession.create({
      data: {
        candidateId: candidate.id,
        messages: initialMessagesJson,
        turnCount: 0,
        startedAt: new Date(),
      },
    });

    return {
      candidate,
      session,
    };
  });
}

export async function getSessionWithDetails(sessionId: string) {
  return await db.interviewSession.findUnique({
    where: { id: sessionId },
    include: {
      candidate: {
        include: {
          job: true,
        },
      },
    },
  });
}

export async function getCandidateSessionByEmail(jobSlug: string, email: string) {
  const job = await db.jobRequisition.findUnique({
    where: { slug: jobSlug },
    select: { id: true },
  });

  if (!job) return null;

  return await db.candidate.findUnique({
    where: {
      jobId_email: {
        jobId: job.id,
        email: email.toLowerCase().trim(),
      },
    },
    include: {
      session: true,
      job: true,
    },
  });
}

export async function recordTurnAndReply(params: {
  sessionId: string;
  candidateId: string;
  messages: ChatMessage[];
  newTurnCount: number;
  isCompleted: boolean;
}) {
  const messagesJson = params.messages as unknown as Prisma.InputJsonValue;

  return await db.$transaction(async (tx) => {
    const updatedSession = await tx.interviewSession.update({
      where: { id: params.sessionId },
      data: {
        messages: messagesJson,
        turnCount: params.newTurnCount,
        completedAt: params.isCompleted ? new Date() : undefined,
      },
    });

    if (params.isCompleted) {
      await tx.candidate.update({
        where: { id: params.candidateId },
        data: {
          status: "COMPLETED_SCREENING",
        },
      });
    }

    return updatedSession;
  });
}
