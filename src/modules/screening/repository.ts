import { db } from "@/lib/db";
import { consumeApplicantQuota } from "@/lib/billing/quota";
import type { ApplicationStatus, Prisma } from "@prisma/client";
import type { ChatMessage } from "./types";

export async function findJobForScreening(slug: string) {
  return await db.jobRequisition.findUnique({
    where: { slug },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          isVerified: true,
          isSuspended: true,
          cultureDescription: true,
        },
      },
    },
  });
}

export async function findCandidateWithSession(
  jobId: string,
  candidateProfileId: string
) {
  return await db.jobApplication.findUnique({
    where: {
      jobId_candidateProfileId: {
        jobId,
        candidateProfileId,
      },
    },
    include: {
      candidateProfile: {
        include: {
          user: true,
        },
      },
      session: true,
    },
  });
}

export interface CreateCandidateParams {
  jobId: string;
  organizationId: string;
  userId: string;
  candidateProfileId: string;
  fullName: string;
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
    // 1. Update user and profile details if provided
    await tx.user.update({
      where: { id: params.userId },
      data: { name: params.fullName },
    });

    const profile = await tx.candidateProfile.update({
      where: { id: params.candidateProfileId },
      data: {
        cvSummaryText: params.cvSummaryText.trim(),
        portfolioUrl: params.portfolioUrl?.trim() || undefined,
      },
    });

    // 2. Check if application already exists
    const existingApp = await tx.jobApplication.findUnique({
      where: {
        jobId_candidateProfileId: {
          jobId: params.jobId,
          candidateProfileId: profile.id,
        },
      },
    });

    if (!existingApp) {
      // ATOMICALLY consume quota on the organization for new applicants!
      await consumeApplicantQuota(tx, params.organizationId);
    }

    // 3. Create or update JobApplication
    const application = await tx.jobApplication.upsert({
      where: {
        jobId_candidateProfileId: {
          jobId: params.jobId,
          candidateProfileId: profile.id,
        },
      },
      create: {
        jobId: params.jobId,
        candidateProfileId: profile.id,
        status: "IN_PROGRESS",
        clientIp: params.clientIp || null,
      },
      update: {
        status: "IN_PROGRESS",
        clientIp: params.clientIp || null,
      },
    });

    // 4. Create or update InterviewSession
    const existingSession = await tx.interviewSession.findUnique({
      where: { applicationId: application.id },
    });

    const session = existingSession
      ? await tx.interviewSession.update({
          where: { applicationId: application.id },
          data: {
            messages: initialMessagesJson,
            turnCount: 0,
            startedAt: new Date(),
            completedAt: null,
          },
        })
      : await tx.interviewSession.create({
          data: {
            applicationId: application.id,
            messages: initialMessagesJson,
            turnCount: 0,
            startedAt: new Date(),
          },
        });

    return {
      candidate: {
        id: application.id,
        fullName: params.fullName,
        cvSummaryText: profile.cvSummaryText,
        portfolioUrl: profile.portfolioUrl,
        status: application.status,
      },
      session,
    };
  });
}

export async function getSessionWithDetails(sessionId: string) {
  return await db.interviewSession.findUnique({
    where: { id: sessionId },
    include: {
      application: {
        include: {
          job: true,
          candidateProfile: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });
}

export async function recordTurnAndReply(
  sessionId: string,
  updatedMessages: Prisma.InputJsonValue,
  newTurnCount: number,
  isCompleted: boolean,
  tokensUsedDelta: number = 0
) {
  return await db.interviewSession.update({
    where: { id: sessionId },
    data: {
      messages: updatedMessages,
      turnCount: newTurnCount,
      totalTokensUsed: { increment: tokensUsedDelta },
      completedAt: isCompleted ? new Date() : undefined,
      application: {
        update: {
          status: isCompleted ? "COMPLETED_SCREENING" : "IN_PROGRESS",
        },
      },
    },
  });
}

export async function setApplicationStatus(
  applicationId: string,
  status: ApplicationStatus
) {
  return await db.jobApplication.update({
    where: { id: applicationId },
    data: { status },
  });
}
