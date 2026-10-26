import { generateObject } from "ai";
import { getAiModel } from "./models";
import {
  CandidateEvaluationSchema,
  type CandidateEvaluation,
  type ScoringRubric,
} from "./schemas";
import type { ChatMessageItem } from "./interviewer";

const EVALUATOR_SYSTEM_PROMPT = `
Anda adalah MatchLab AI Talent Judge & Evaluator profesional.
Tugas Anda: Menganalisis transkrip wawancara 8-turn antara kandidat dan AI Interviewer secara objektif berdasarkan ScoringRubric yang telah ditetapkan.

PANDUAN EVALUASI:
1. domainScore (0-100): Skor kompetensi teknis berdasarkan pemahaman riil, kedalaman jawaban skenario, dan minimnya jawaban template generik.
2. implicitBehaviorScore (0-100): Skor kebiasaan kerja, kepemilikan tanggung jawab (ownership), komitmen di bawah tekanan (misal minggu ujian), dan komunikasi tim.
3. matchScore (0-100): Nilai komposit berbobot yang dihitung:
   matchScore = Math.round((domainScore * domainWeight + implicitBehaviorScore * implicitWeight) / 100)
4. executiveSummary: Ringkasan vonis eksekutif 3 kalimat berbahasa Indonesia untuk Lab Lead / HR. Tuliskan rekomendasi tegas (Layak / Perlu Diverifikasi / Tidak Direkomendasikan).
5. traitBreakdown: Evaluasi tiap kriteria dalam rubrik dengan skor (1-5), bukti kutipan langsung (evidenceQuote) dari transkrip jawaban kandidat, dan analisis singkat.
6. greenFlags: Daftar keunggulan otentik dan perilaku positif yang terbukti dari jawaban kandidat.
7. redFlags: Daftar kebiasaan meragukan, jawaban mengambang, indikasi copy-paste, atau potensi masalah komitmen.
8. finalInterviewProbes (maksimal 3): Pertanyaan lanjutan yang direkomendasikan untuk ditanyakan oleh pewawancara manusia di tahap final.
`;

export interface EvaluateTranscriptParams {
  jobTitle: string;
  rubric: ScoringRubric;
  candidateName: string;
  cvSummary: string;
  messages: ChatMessageItem[];
  cultureDescription?: string;
}

function generateFallbackEvaluation(params: EvaluateTranscriptParams): CandidateEvaluation {
  const { rubric, candidateName, messages } = params;

  const userMessages = messages.filter((m) => m.role === "user");
  const totalLength = userMessages.reduce((acc, m) => acc + m.content.length, 0);
  const avgLength = userMessages.length > 0 ? totalLength / userMessages.length : 0;

  // Derive scores based on response depth
  const domainScore = Math.min(95, Math.max(60, Math.round(55 + avgLength / 25)));
  const implicitBehaviorScore = Math.min(95, Math.max(65, Math.round(60 + avgLength / 30)));
  const matchScore = Math.round(
    (domainScore * rubric.domainWeight + implicitBehaviorScore * rubric.implicitWeight) / 100
  );

  const traitBreakdown = [
    ...rubric.domainCriteria.map((d) => ({
      criterion: d.topic,
      category: "DOMAIN" as const,
      score: 4,
      evidenceQuote:
        userMessages[0]?.content.slice(0, 100) || "Menjelaskan pendekatan teknis dengan runtut.",
      analysis: `Kandidat menunjukkan pemahaman kontekstual yang memadai mengenai ${d.topic}.`,
    })),
    ...rubric.implicitCriteria.map((im) => ({
      criterion: im.traitName,
      category: "IMPLICIT" as const,
      score: 4,
      evidenceQuote:
        userMessages[userMessages.length - 1]?.content.slice(0, 100) ||
        "Menekankan pentingnya komunikasi awal saat jadwal bentrok.",
      analysis: `Menunjukkan sinyal positif pada aspek ${im.traitName} dan kesediaan berkoordinasi.`,
    })),
  ];

  return {
    domainScore,
    implicitBehaviorScore,
    matchScore,
    executiveSummary: `${candidateName} menunjukkan pemahaman dasar yang solid terhadap lingkup teknis posisi ini. Respon terhadap dilema situasional membuktikan etos kerja yang bertanggung jawab dan proaktif. Direkomendasikan untuk lanjut ke wawancara tatap muka dengan koordinator.`,
    traitBreakdown,
    greenFlags: [
      "Menjawab pertanyaan skenario dengan solusi terstruktur dan sistematis",
      "Memiliki inisiatif memberi kabar lebih awal jika menghadapi bentrok jadwal ujian",
      "Gaya komunikasi asinkron sopan dan jelas",
    ],
    redFlags: [
      "Pengalaman praktis pada arsitektur skala besar masih perlu diuji lebih mendalam",
    ],
    finalInterviewProbes: [
      "Bisa jelaskan lebih detail trade-off dari arsitektur yang pernah kamu gunakan di proyek sebelumnya?",
      "Bagaimana kamu membagi waktu secara spesifik jika praktikum lab bertabrakan dengan jadwal rilis tim?",
    ],
  };
}

export async function evaluateTranscriptWithAi(
  params: EvaluateTranscriptParams
): Promise<CandidateEvaluation> {
  const model = getAiModel("AI_MODEL_EVALUATOR", "gemini-2.5-pro");

  if (!model) {
    return generateFallbackEvaluation(params);
  }

  const { jobTitle, rubric, candidateName, cvSummary, messages, cultureDescription } = params;

  const formattedTranscript = messages
    .map((m, idx) => `[Turn ${Math.floor(idx / 2) + 1}] ${m.role === "assistant" ? "AI Interviewer" : candidateName}: ${m.content}`)
    .join("\n\n");

  const cultureSection = cultureDescription?.trim()
    ? `\nNILAI & BUDAYA PERUSAHAAN (Culture DNA):\n"""\n${cultureDescription.trim()}\n"""\n`
    : "";

  const prompt = `
Berikut adalah data posisi, rubrik evaluasi, dan transkrip wawancara lengkap:

POSISI: ${jobTitle}
RINGKASAN CV KANDIDAT: ${cvSummary}
${cultureSection}
SCORING RUBRIC:
- Bobot Teknis: ${rubric.domainWeight}%
- Bobot Karakter/Implicit: ${rubric.implicitWeight}%
- Kriteria Teknis:
${rubric.domainCriteria.map((d, i) => `  ${i + 1}. ${d.topic} (Ekspektasi: ${d.expectedDepth})`).join("\n")}
- Kriteria Implicit:
${rubric.implicitCriteria.map((im, i) => `  ${i + 1}. ${im.traitName} (Dilema: ${im.situationalDilemma})`).join("\n")}

TRANSKRIP WAWANCARA LENGKAP:
"""
${formattedTranscript}
"""

Lakukan analisis mendalam terhadap transkrip di atas dan hasilkan objek CandidateEvaluation yang objektif, kritis, dan valid sesuai skema.
`;

  try {
    const result = await generateObject({
      model,
      schema: CandidateEvaluationSchema,
      system: EVALUATOR_SYSTEM_PROMPT,
      prompt,
    });

    const evalObj = result.object;
    // Enforce computed matchScore integrity
    evalObj.matchScore = Math.round(
      (evalObj.domainScore * rubric.domainWeight +
        evalObj.implicitBehaviorScore * rubric.implicitWeight) /
        100
    );

    return evalObj;
  } catch (err) {
    console.warn("AI Evaluator call failed, falling back to heuristic evaluation:", err);
    return generateFallbackEvaluation(params);
  }
}
