import type { ApplicationStatus } from "@prisma/client";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface CandidateRegistrationInput {
  jobSlug: string;
  fullName: string;
  email: string;
  cvSummaryText: string;
  portfolioUrl?: string;
  clientIp?: string;
}

export interface InterviewSessionData {
  id: string;
  candidateId: string;
  candidateName: string;
  jobTitle: string;
  jobSlug: string;
  messages: ChatMessage[];
  turnCount: number;
  maxTurns: number;
  isCompleted: boolean;
  status: ApplicationStatus;
}

export interface RegisterCandidateResult {
  success: boolean;
  session?: InterviewSessionData;
  error?: string;
}

export interface SendMessageResult {
  success: boolean;
  reply?: string;
  turnCount?: number;
  isCompleted?: boolean;
  session?: InterviewSessionData;
  error?: string;
}
