"use server";

import { headers } from "next/headers";
import { assertJobSeeker, toActionError } from "@/lib/auth/guards";
import {
  registerCandidate,
  sendCandidateMessage,
  getSessionData,
} from "./service";
import type {
  CandidateRegistrationInput,
  InterviewSessionData,
  RegisterCandidateResult,
  SendMessageResult,
} from "./types";

export async function registerCandidateAction(
  input: CandidateRegistrationInput
): Promise<RegisterCandidateResult> {
  try {
    const seeker = await assertJobSeeker();

    const reqHeaders = await headers();
    const clientIp =
      reqHeaders.get("cf-connecting-ip") ||
      reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      reqHeaders.get("x-real-ip") ||
      undefined;

    return await registerCandidate(
      {
        jobSlug: input.jobSlug,
        fullName: input.fullName,
        cvSummaryText: input.cvSummaryText,
        portfolioUrl: input.portfolioUrl,
        clientIp,
      },
      {
        id: seeker.id,
        email: seeker.email,
        candidateProfileId: seeker.candidateProfileId!,
      }
    );
  } catch (error) {
    return {
      success: false,
      error: toActionError(error, "Gagal memulai pendaftaran wawancara."),
    };
  }
}

export async function sendCandidateMessageAction(
  sessionId: string,
  message: string
): Promise<SendMessageResult> {
  try {
    const seeker = await assertJobSeeker();
    return await sendCandidateMessage(sessionId, message, seeker.id);
  } catch (error) {
    return {
      success: false,
      error: toActionError(error, "Gagal mengirimkan jawaban."),
    };
  }
}

export async function getSessionDataAction(
  sessionId: string
): Promise<InterviewSessionData | null> {
  try {
    const seeker = await assertJobSeeker();
    return await getSessionData(sessionId, seeker.id);
  } catch {
    return null;
  }
}
