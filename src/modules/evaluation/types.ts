import type { ApplicationStatus } from "@prisma/client";
import type { CandidateEvaluation, ScoringRubric } from "@/lib/ai/schemas";
import type { ChatMessage } from "@/modules/screening/types";

export type { CandidateEvaluation };

export interface LeaderboardCandidate {
  id: string;
  fullName: string;
  email: string;
  cvSummaryText: string;
  portfolioUrl: string | null;
  status: ApplicationStatus;
  createdAt: Date;
  turnCount: number;
  messages: ChatMessage[];
  evaluation: CandidateEvaluation | null;
}

export interface JobLeaderboardData {
  id: string;
  title: string;
  slug: string;
  rawUserPrompt: string;
  maxTurns: number;
  organization: {
    name: string;
    slug: string;
  };
  scoringRubric: ScoringRubric;
  candidates: LeaderboardCandidate[];
}

export interface EvaluateResult {
  success: boolean;
  evaluation?: CandidateEvaluation;
  error?: string;
}

export interface UpdateStatusResult {
  success: boolean;
  status?: ApplicationStatus;
  error?: string;
}
