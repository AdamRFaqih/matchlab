import {
  findJobForScreening,
  findCandidateWithSession,
  createCandidateAndSession,
  getSessionWithDetails,
  recordTurnAndReply,
} from "./repository";
import {
  getInitialGreetingMessage,
  generateInterviewReply,
  type ChatMessageItem,
} from "@/lib/ai/interviewer";
import { ScoringRubricSchema } from "@/lib/ai/schemas";
import type {
  CandidateRegistrationInput,
  ChatMessage,
  InterviewSessionData,
  RegisterCandidateResult,
  SendMessageResult,
} from "./types";

export const MAX_INTERVIEW_TURNS = 8;
export const MAX_MESSAGE_LENGTH = 1200;

function parseMessages(rawJson: unknown): ChatMessage[] {
  if (!Array.isArray(rawJson)) return [];
  return rawJson.map((item, idx) => ({
    id: typeof item.id === "string" ? item.id : `msg-${idx}`,
    role: item.role === "user" ? ("user" as const) : ("assistant" as const),
    content: typeof item.content === "string" ? item.content : "",
    timestamp: typeof item.timestamp === "string" ? item.timestamp : new Date().toISOString(),
  }));
}

export async function registerCandidate(
  input: CandidateRegistrationInput
): Promise<RegisterCandidateResult> {
  const fullName = input.fullName.trim();
  const email = input.email.toLowerCase().trim();
  const cvSummary = input.cvSummaryText.trim();

  if (fullName.length < 2) {
    return { success: false, error: "Nama lengkap minimal 2 karakter." };
  }
  if (!email.includes("@") || !email.includes(".")) {
    return { success: false, error: "Format alamat email tidak valid." };
  }
  if (cvSummary.length < 10) {
    return {
      success: false,
      error: "Ringkasan CV/pengalaman minimal 10 karakter agar AI memiliki konteks awal.",
    };
  }

  const job = await findJobForScreening(input.jobSlug);
  if (!job) {
    return {
      success: false,
      error: "Posisi lowongan tidak ditemukan atau sudah tidak aktif.",
    };
  }

  const rubric = ScoringRubricSchema.parse(job.scoringRubric);
  const maxTurns = job.maxTurns || MAX_INTERVIEW_TURNS;

  // Check if candidate already registered
  const existing = await findCandidateWithSession(job.id, email);
  if (existing && existing.session) {
    const existingMessages = parseMessages(existing.session.messages);
    return {
      success: true,
      session: {
        id: existing.session.id,
        candidateId: existing.id,
        candidateName: existing.candidateProfile.user.name,
        jobTitle: job.title,
        jobSlug: job.slug,
        messages: existingMessages,
        turnCount: existing.session.turnCount,
        maxTurns,
        isCompleted: existing.session.completedAt !== null || existing.session.turnCount >= maxTurns,
        status: existing.status,
      },
    };
  }

  // Generate initial welcome & turn 1 probe message
  const greetingText = getInitialGreetingMessage(job.title, fullName, rubric);
  const initialMessage: ChatMessage = {
    id: crypto.randomUUID(),
    role: "assistant",
    content: greetingText,
    timestamp: new Date().toISOString(),
  };

  const created = await createCandidateAndSession({
    jobId: job.id,
    fullName,
    email,
    cvSummaryText: cvSummary,
    portfolioUrl: input.portfolioUrl,
    clientIp: input.clientIp,
    initialMessage,
  });

  return {
    success: true,
    session: {
      id: created.session.id,
      candidateId: created.candidate.id,
      candidateName: created.candidate.fullName,
      jobTitle: job.title,
      jobSlug: job.slug,
      messages: [initialMessage],
      turnCount: 0,
      maxTurns,
      isCompleted: false,
      status: created.candidate.status,
    },
  };
}

export async function sendCandidateMessage(
  sessionId: string,
  rawMessage: string
): Promise<SendMessageResult> {
  const sessionRecord = await getSessionWithDetails(sessionId);
  if (!sessionRecord) {
    return { success: false, error: "Sesi wawancara tidak ditemukan." };
  }

  const application = sessionRecord.application;
  const job = application.job;
  const candidateName = application.candidateProfile.user.name;
  const cvSummary = application.candidateProfile.cvSummaryText;
  const candidateId = application.id;
  const maxTurns = job.maxTurns || MAX_INTERVIEW_TURNS;

  // Guardrail 1: Enforce hard turn limit and completion check on server
  if (sessionRecord.completedAt !== null || sessionRecord.turnCount >= maxTurns) {
    return {
      success: false,
      error: `Sesi wawancara telah mencapai batas maksimal (${maxTurns} giliran) dan telah selesai.`,
      isCompleted: true,
    };
  }

  // Guardrail 2: Input sanitization & character length limit
  const sanitizedContent = rawMessage.trim().slice(0, MAX_MESSAGE_LENGTH);
  if (sanitizedContent.length === 0) {
    return { success: false, error: "Pesan tidak boleh kosong." };
  }

  const currentMessages = parseMessages(sessionRecord.messages);
  const nextTurn = sessionRecord.turnCount + 1;
  const isCompleted = nextTurn >= maxTurns;

  const candidateMessageItem: ChatMessage = {
    id: crypto.randomUUID(),
    role: "user",
    content: sanitizedContent,
    timestamp: new Date().toISOString(),
  };

  const rubric = ScoringRubricSchema.parse(job.scoringRubric);

  const messagesForAi: ChatMessageItem[] = currentMessages.map((m) => ({
    role: m.role,
    content: m.content,
    timestamp: m.timestamp,
  }));

  // Guardrail 3: Call AI interviewer with candidate_input XML wrapping
  const replyText = await generateInterviewReply({
    jobTitle: job.title,
    candidateName,
    cvSummary,
    rubric,
    messages: messagesForAi,
    currentTurn: nextTurn,
    maxTurns,
    candidateMessage: sanitizedContent,
  });

  const assistantMessageItem: ChatMessage = {
    id: crypto.randomUUID(),
    role: "assistant",
    content: replyText,
    timestamp: new Date().toISOString(),
  };

  const updatedMessages = [
    ...currentMessages,
    candidateMessageItem,
    assistantMessageItem,
  ];

  await recordTurnAndReply({
    sessionId: sessionRecord.id,
    candidateId,
    messages: updatedMessages,
    newTurnCount: nextTurn,
    isCompleted,
  });

  // Flow C trigger: Automatic transcript evaluation upon completing screening
  if (isCompleted) {
    try {
      const { evaluateCandidateTranscript } = await import("@/modules/evaluation/service");
      await evaluateCandidateTranscript(candidateId);
    } catch (evalErr) {
      console.warn("Auto-evaluation failed, can be re-evaluated from dashboard:", evalErr);
    }
  }

  const sessionData: InterviewSessionData = {
    id: sessionRecord.id,
    candidateId,
    candidateName,
    jobTitle: job.title,
    jobSlug: job.slug,
    messages: updatedMessages,
    turnCount: nextTurn,
    maxTurns,
    isCompleted,
    status: isCompleted ? "COMPLETED_SCREENING" : "IN_PROGRESS",
  };

  return {
    success: true,
    reply: replyText,
    turnCount: nextTurn,
    isCompleted,
    session: sessionData,
  };
}

export async function getSessionData(
  sessionId: string
): Promise<InterviewSessionData | null> {
  const sessionRecord = await getSessionWithDetails(sessionId);
  if (!sessionRecord) return null;

  const application = sessionRecord.application;
  const job = application.job;
  const candidateName = application.candidateProfile.user.name;
  const maxTurns = job.maxTurns || MAX_INTERVIEW_TURNS;

  return {
    id: sessionRecord.id,
    candidateId: application.id,
    candidateName,
    jobTitle: job.title,
    jobSlug: job.slug,
    messages: parseMessages(sessionRecord.messages),
    turnCount: sessionRecord.turnCount,
    maxTurns,
    isCompleted: sessionRecord.completedAt !== null || sessionRecord.turnCount >= maxTurns,
    status: application.status,
  };
}
