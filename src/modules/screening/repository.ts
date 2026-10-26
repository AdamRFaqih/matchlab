import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { ChatMessage } from "./types";
import crypto from "node:crypto";

export async function findJobForScreening(slug: string) {
  return await db.jobRequisition.findUnique({
    where: { slug, isActive: true },
    include: {
      organization: true,
    },
  });
}

export async function findCandidateWithSession(jobId: string, email: string) {
  const user = await db.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: {
      candidateProfile: true,
    },
  });

  if (!user || !user.candidateProfile) return null;

  return await db.jobApplication.findUnique({
    where: {
      jobId_candidateProfileId: {
        jobId,
        candidateProfileId: user.candidateProfile.id,
      },
    },
    include: {
      session: true,
      job: true,
      candidateProfile: {
        include: {
          user: true,
        },
      },
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

  const email = params.email.toLowerCase().trim();
  const fullName = params.fullName.trim();

  return await db.$transaction(async (tx) => {
    // 1. Get or create User
    let user = await tx.user.findUnique({
      where: { email },
    });

    if (!user) {
      const defaultHash = crypto.createHash("sha256").update(email + "matchlab").digest("hex");
      user = await tx.user.create({
        data: {
          name: fullName,
          email,
          passwordHash: defaultHash,
          systemRole: "JOB_SEEKER",
          isActive: true,
        },
      });
    }

    // 2. Get or create CandidateProfile
    let profile = await tx.candidateProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      profile = await tx.candidateProfile.create({
        data: {
          userId: user.id,
          cvSummaryText: params.cvSummaryText.trim(),
          portfolioUrl: params.portfolioUrl?.trim() || null,
          isOpenToPool: true,
        },
      });
    } else {
      profile = await tx.candidateProfile.update({
        where: { id: profile.id },
        data: {
          cvSummaryText: params.cvSummaryText.trim(),
          portfolioUrl: params.portfolioUrl?.trim() || profile.portfolioUrl,
        },
      });
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
        fullName: user.name,
        email: user.email,
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

export async function getCandidateSessionByEmail(jobSlug: string, email: string) {
  const job = await db.jobRequisition.findUnique({
    where: { slug: jobSlug },
    select: { id: true },
  });

  if (!job) return null;

  return await findCandidateWithSession(job.id, email);
}

export async function recordTurnAndReply(params: {
  sessionId: string;
  candidateId: string; // Corresponds to applicationId
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
      await tx.jobApplication.update({
        where: { id: params.candidateId },
        data: {
          status: "COMPLETED_SCREENING",
        },
      });
    }

    return updatedSession;
  });
}
