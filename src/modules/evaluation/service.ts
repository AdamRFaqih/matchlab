import {
  saveEvaluationRecord,
  getJobWithLeaderboard,
  getCandidateForEvaluation,
  updateCandidateApplicationStatus,
} from "./repository";
import { evaluateTranscriptWithAi } from "@/lib/ai/evaluator";
import {
  CandidateEvaluationSchema,
  ScoringRubricSchema,
  type CandidateEvaluation,
} from "@/lib/ai/schemas";
import type { ChatMessageItem } from "@/lib/ai/interviewer";
import type { ApplicationStatus } from "@prisma/client";
import type {
  EvaluateResult,
  JobLeaderboardData,
  LeaderboardCandidate,
  UpdateStatusResult,
} from "./types";
import type { ChatMessage } from "@/modules/screening/types";

function parseChatMessages(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, idx) => ({
    id: typeof item.id === "string" ? item.id : `msg-${idx}`,
    role: item.role === "user" ? ("user" as const) : ("assistant" as const),
    content: typeof item.content === "string" ? item.content : "",
    timestamp: typeof item.timestamp === "string" ? item.timestamp : new Date().toISOString(),
  }));
}

export async function evaluateCandidateTranscript(
  candidateId: string
): Promise<EvaluateResult> {
  const candidateRecord = await getCandidateForEvaluation(candidateId);

  if (!candidateRecord) {
    return { success: false, error: "Kandidat tidak ditemukan." };
  }

  const { job, session, candidateProfile } = candidateRecord;
  if (!session) {
    return { success: false, error: "Sesi wawancara kandidat belum dimulai." };
  }

  const rubric = ScoringRubricSchema.parse(job.scoringRubric);
  const messages = parseChatMessages(session.messages);

  const messagesForAi: ChatMessageItem[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
    timestamp: m.timestamp,
  }));

  try {
    const rawEvaluation = await evaluateTranscriptWithAi({
      jobTitle: job.title,
      rubric,
      candidateName: candidateProfile.user.name,
      cvSummary: candidateProfile.cvSummaryText,
      messages: messagesForAi,
    });

    const validatedEval = CandidateEvaluationSchema.parse(rawEvaluation);

    await saveEvaluationRecord(candidateId, validatedEval);

    return {
      success: true,
      evaluation: validatedEval,
    };
  } catch (err) {
    console.error("Evaluation failed for candidate", candidateId, err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal mengevaluasi transkrip wawancara.",
    };
  }
}

export async function getJobLeaderboardData(
  jobId: string
): Promise<JobLeaderboardData | null> {
  const job = await getJobWithLeaderboard(jobId);
  if (!job) return null;

  const rubric = ScoringRubricSchema.parse(job.scoringRubric);

  const candidates: LeaderboardCandidate[] = job.applications.map((c) => {
    let evaluation: CandidateEvaluation | null = null;

    if (c.evaluation) {
      evaluation = {
        domainScore: c.evaluation.domainScore,
        implicitBehaviorScore: c.evaluation.implicitBehaviorScore,
        matchScore: c.evaluation.matchScore,
        executiveSummary: c.evaluation.executiveSummary,
        traitBreakdown: (c.evaluation.traitBreakdown as unknown as CandidateEvaluation["traitBreakdown"]) || [],
        greenFlags: c.evaluation.greenFlags,
        redFlags: c.evaluation.redFlags,
        finalInterviewProbes: c.evaluation.finalInterviewProbes,
      };
    }

    return {
      id: c.id,
      fullName: c.candidateProfile.user.name,
      email: c.candidateProfile.user.email,
      cvSummaryText: c.candidateProfile.cvSummaryText,
      portfolioUrl: c.candidateProfile.portfolioUrl,
      status: c.status,
      createdAt: c.createdAt,
      turnCount: c.session?.turnCount ?? 0,
      messages: parseChatMessages(c.session?.messages),
      evaluation,
    };
  });

  return {
    id: job.id,
    title: job.title,
    slug: job.slug,
    rawUserPrompt: job.rawUserPrompt,
    maxTurns: job.maxTurns,
    organization: {
      name: job.organization.name,
      slug: job.organization.slug,
    },
    scoringRubric: rubric,
    candidates,
  };
}

export async function updateCandidateStatus(
  candidateId: string,
  status: ApplicationStatus
): Promise<UpdateStatusResult> {
  try {
    const updated = await updateCandidateApplicationStatus(candidateId, status);
    return {
      success: true,
      status: updated.status,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal memperbarui status kandidat.",
    };
  }
}
