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
import { evaluateCandidateTranscript } from "@/modules/evaluation/service";
import { QuotaExceededError } from "@/lib/billing/quota";
import { rateLimit } from "@/lib/rate-limit";
import type {
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
  input: {
    jobSlug: string;
    fullName: string;
    cvSummaryText: string;
    portfolioUrl?: string;
    clientIp?: string;
  },
  seeker: {
    id: string;
    email: string;
    candidateProfileId: string;
  }
): Promise<RegisterCandidateResult> {
  const fullName = input.fullName.trim();
  const cvSummary = input.cvSummaryText.trim();

  if (fullName.length < 2) {
    return { success: false, error: "Nama lengkap minimal 2 karakter." };
  }
  if (cvSummary.length < 10) {
    return {
      success: false,
      error: "Ringkasan CV/pengalaman minimal 10 karakter agar AI memiliki konteks awal.",
    };
  }

  const job = await findJobForScreening(input.jobSlug);
  if (!job || !job.isActive) {
    return {
      success: false,
      error: "Posisi lowongan tidak ditemukan atau sudah tidak menerima pendaftaran.",
    };
  }

  if (job.organization.isSuspended) {
    return {
      success: false,
      error: "Organisasi ini sedang ditangguhkan dan tidak dapat menerima pelamar baru.",
    };
  }

  const rubric = ScoringRubricSchema.parse(job.scoringRubric);
  const maxTurns = job.maxTurns || MAX_INTERVIEW_TURNS;

  // Check if candidate already registered for this job
  const existing = await findCandidateWithSession(job.id, seeker.candidateProfileId);
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

  try {
    const created = await createCandidateAndSession({
      jobId: job.id,
      organizationId: job.organization.id,
      userId: seeker.id,
      candidateProfileId: seeker.candidateProfileId,
      fullName,
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
  } catch (error) {
    if (error instanceof QuotaExceededError) {
      return {
        success: false,
        error: "Mohon maaf, kuota pelamar untuk lowongan organisasi ini telah mencapai batas maksimal.",
      };
    }
    throw error;
  }
}

export async function sendCandidateMessage(
  sessionId: string,
  message: string,
  seekerUserId: string
): Promise<SendMessageResult> {
  const trimmed = message.trim();
  if (!trimmed) {
    return { success: false, error: "Pesan tidak boleh kosong." };
  }
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return {
      success: false,
      error: `Pesan melebihi batas ${MAX_MESSAGE_LENGTH} karakter. Mohon persingkat jawaban Anda.`,
    };
  }

  // Rate limit candidate messages: max 30 per minute per candidate
  const rLimit = rateLimit(`candidate-msg:${seekerUserId}`, 30, 60 * 1000);
  if (!rLimit.ok) {
    return {
      success: false,
      error: `Anda mengirim pesan terlalu cepat. Mohon tunggu ${rLimit.retryAfterSeconds} detik.`,
    };
  }

  const sessionRecord = await getSessionWithDetails(sessionId);
  if (!sessionRecord) {
    return { success: false, error: "Sesi wawancara tidak ditemukan." };
  }

  // Verification: ensure session belongs to calling seeker!
  if (sessionRecord.application.candidateProfile.user.id !== seekerUserId) {
    return { success: false, error: "Akses sesi wawancara ditolak." };
  }

  const { application } = sessionRecord;
  const { job, candidateProfile } = application;
  const maxTurns = job.maxTurns || MAX_INTERVIEW_TURNS;

  if (sessionRecord.completedAt || sessionRecord.turnCount >= maxTurns) {
    return {
      success: false,
      error: "Sesi wawancara sudah selesai. Jawaban tidak dapat ditambahkan lagi.",
    };
  }

  const rubric = ScoringRubricSchema.parse(job.scoringRubric);
  const existingMessages = parseMessages(sessionRecord.messages);

  const userChatMessage: ChatMessage = {
    id: crypto.randomUUID(),
    role: "user",
    content: trimmed,
    timestamp: new Date().toISOString(),
  };

  const newTurnCount = sessionRecord.turnCount + 1;
  const isFinalTurn = newTurnCount >= maxTurns;

  const messagesForAi: ChatMessageItem[] = [
    ...existingMessages.map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
    })),
    {
      role: userChatMessage.role,
      content: userChatMessage.content,
      timestamp: userChatMessage.timestamp,
    },
  ];

  let replyContent = "";
  try {
    replyContent = await generateInterviewReply({
      jobTitle: job.title,
      rubric,
      candidateName: candidateProfile.user.name,
      cvSummary: candidateProfile.cvSummaryText,
      candidateMessage: trimmed,
      messages: messagesForAi,
      currentTurn: newTurnCount,
      maxTurns,
    });
  } catch (err) {
    console.error("AI reply generation error:", err);
    replyContent =
      "Terima kasih atas jawaban Anda. Sistem mencatat respons Anda dan kita akan melanjutkan ke tahap berikutnya.";
  }

  const assistantChatMessage: ChatMessage = {
    id: crypto.randomUUID(),
    role: "assistant",
    content: replyContent,
    timestamp: new Date().toISOString(),
  };

  const updatedMessages: ChatMessage[] = [
    ...existingMessages,
    userChatMessage,
    assistantChatMessage,
  ];

  await recordTurnAndReply(
    sessionId,
    updatedMessages as unknown as object,
    newTurnCount,
    isFinalTurn,
    0
  );

  // When interview finishes (reaches max turns), trigger evaluation automatically in the background
  if (isFinalTurn) {
    evaluateCandidateTranscript(application.id).catch((err) => {
      console.error("Background evaluation trigger failed:", err);
    });
  }

  return {
    success: true,
    reply: replyContent,
    turnCount: newTurnCount,
    isCompleted: isFinalTurn,
  };
}

export async function getSessionData(
  sessionId: string,
  seekerUserId: string
): Promise<InterviewSessionData | null> {
  const sessionRecord = await getSessionWithDetails(sessionId);
  if (!sessionRecord) return null;

  // Tenant/Ownership check
  if (sessionRecord.application.candidateProfile.user.id !== seekerUserId) {
    return null;
  }

  const { application } = sessionRecord;
  const { job, candidateProfile } = application;
  const maxTurns = job.maxTurns || MAX_INTERVIEW_TURNS;

  return {
    id: sessionRecord.id,
    candidateId: application.id,
    candidateName: candidateProfile.user.name,
    jobTitle: job.title,
    jobSlug: job.slug,
    messages: parseMessages(sessionRecord.messages),
    turnCount: sessionRecord.turnCount,
    maxTurns,
    isCompleted: sessionRecord.completedAt !== null || sessionRecord.turnCount >= maxTurns,
    status: application.status,
  };
}
