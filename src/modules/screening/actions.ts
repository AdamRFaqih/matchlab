"use server";

import { headers } from "next/headers";
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
  const reqHeaders = await headers();
  const clientIp =
    reqHeaders.get("cf-connecting-ip") ||
    reqHeaders.get("x-forwarded-for")?.split(",")[0] ||
    undefined;

  return await registerCandidate({
    ...input,
    clientIp,
  });
}

export async function sendCandidateMessageAction(
  sessionId: string,
  message: string
): Promise<SendMessageResult> {
  return await sendCandidateMessage(sessionId, message);
}

export async function getSessionDataAction(
  sessionId: string
): Promise<InterviewSessionData | null> {
  return await getSessionData(sessionId);
}
