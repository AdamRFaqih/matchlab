import { generateObject } from "ai";
import { getAiModel } from "./models";
import { ScoringRubric, ScoringRubricSchema } from "./schemas";

const TRANSLATOR_SYSTEM_PROMPT = `
Anda adalah AI Requirement Translator untuk MatchLab (SaaS Two-Way Talent Matchmaker & Early Screening).
Tugas Anda: Mengubah deskripsi kebutuhan casual berbahasa Indonesia dari pimpinan lab (Lab Lead), ketua UKM, atau manajer SME menjadi ScoringRubric yang terstruktur, tajam, dan objektif.

Panduan Output:
1. roleSummary: Ringkasan singkat berbahasa Indonesia yang jelas, profesional, dan menarik bagi kandidat.
2. domainWeight: Bobot persentase teknis/domain (antara 10-90). Default 50-60%.
3. implicitWeight: Bobot persentase karakter/soft skill/habits (harus berjumlah tepat 100 bersama domainWeight).
4. domainCriteria (2 hingga 4 item):
   - topic: Nama topik/keterampilan teknis.
   - expectedDepth: Ekspektasi konkret jawaban yang baik vs dangkal.
   - probeQuestion: Pertanyaan skenario praktis dan situasional yang tidak bisa langsung di-copy-paste ke Google/ChatGPT.
5. implicitCriteria (2 hingga 4 item):
   - traitName: Karakter/kebiasaan kerja penting (misal: "Komitmen Kehadiran Saat Minggu Ujian", "Ownership & Tanggung Jawab Mandiri", "Komunikasi Proaktif Asinkron").
   - positiveIndicators: Tanda-tanda kandidat memiliki karakter ini.
   - redFlagIndicators: Tanda-tanda bahaya / perilaku red flag yang dihindari tim.
   - situationalDilemma: Pertanyaan dilema realistis untuk menguji respon dan kebiasaan asli kandidat.
`;

function generateFallbackRubric(rawPrompt: string): ScoringRubric {
  const lower = rawPrompt.toLowerCase();
  const hasDocker = lower.includes("docker") || lower.includes("container");
  const hasLinux = lower.includes("linux") || lower.includes("bash") || lower.includes("terminal");
  const hasUjian = lower.includes("ujian") || lower.includes("hilang") || lower.includes("sibuk") || lower.includes("komitmen");
  const hasInisiatif = lower.includes("inisiatif") || lower.includes("ownership") || lower.includes("mandiri");

  const domainCriteria = [];

  if (hasDocker) {
    domainCriteria.push({
      topic: "Docker & Containerization Dasar",
      expectedDepth:
        "Memahami konsep image vs container, port mapping, volume mount data persisten, dan debugging container yang crash.",
      probeQuestion:
        "Jika aplikasi di dalam container tidak bisa diakses dari browser meski container statusnya 'Up', langkah apa saja yang kamu lakukan untuk melacak masalahnya?",
    });
  }

  if (hasLinux || !hasDocker) {
    domainCriteria.push({
      topic: "Navigasi & Operasional Linux Server",
      expectedDepth:
        "Terbiasa dengan CLI, izin berkas (chmod/chown), manajemen proses (ps, kill, systemctl), dan membaca log di /var/log.",
      probeQuestion:
        "Server lab tiba-tiba mengalami lonjakan CPU hingga 100% dan respon SSH sangat lambat. Bagaimana urutan analisismu dari terminal untuk menemukan biang keroknya?",
    });
  }

  if (domainCriteria.length < 2) {
    domainCriteria.push({
      topic: "Troubleshooting Sistem & Logika Debugging",
      expectedDepth:
        "Mampu mengisolasi masalah secara sistematis dari layer jaringan, konfigurasi, hingga kode aplikasi.",
      probeQuestion:
        "Ceritakan satu kendala teknis tersulit yang pernah kamu hadapi sendiri dan bagaimana proses berpikirmu sampai masalah itu terpecahkan?",
    });
  }

  const implicitCriteria = [];

  if (hasUjian) {
    implicitCriteria.push({
      traitName: "Komitmen Waktu & Kehadiran Saat Periode Sibuk / Ujian",
      positiveIndicators: [
        "Memberikan kabar (head-up) minimal 3 hari sebelum jadwal bentrok",
        "Menyelesaikan tanggung jawab lab sebelum minggu ujian dimulai",
        "Tetap responsif untuk hal-hal darurat dan terorganisir",
      ],
      redFlagIndicators: [
        "Menghilang tanpa kabar (ghosting) saat tugas mendesak",
        "Menjadikan ujian alasan mangkir total tanpa mitigasi pekerjaan",
        "Baru memberi tahu setelah deadline terlewat",
      ],
      situationalDilemma:
        "Besok adalah ujian mata kuliah terberatmu, namun malam ini server lab down dan mahasiswa lain komplain tidak bisa kumpul tugas. Apa yang akan kamu lakukan secara konkret?",
    });
  }

  if (hasInisiatif || implicitCriteria.length < 2) {
    implicitCriteria.push({
      traitName: "Ownership & Inisiatif Solutif Mandiri",
      positiveIndicators: [
        "Mencoba mencari solusi dan riset mandiri sebelum bertanya ke koordinator",
        "Merasa memiliki tanggung jawab terhadap kelancaran lab",
        "Mendokumentasikan solusi agar bisa dipelajari anggota lain",
      ],
      redFlagIndicators: [
        "Hanya bekerja jika disuruh langsung (pasif/batu)",
        "Melempar kesalahan ke rekan tim jika ada server mati",
        "Mudah menyerah ketika error tidak ditemukan di Google",
      ],
      situationalDilemma:
        "Kamu menemukan sebuah prosedur di lab yang sangat tidak efisien dan rentan membuat data hilang, tapi koordinator lab sedang sibuk konferensi di luar kota. Apa tindakanmu?",
    });
  }

  if (implicitCriteria.length < 2) {
    implicitCriteria.push({
      traitName: "Komunikasi Asinkron & Kerja Tim",
      positiveIndicators: [
        "Pesan rapi, to the point, dan menyertakan konteks lengkap",
        "Mau menerima kritik dan evaluasi dari sesama asisten",
      ],
      redFlagIndicators: [
        "Pesan tidak jelas dan pasif agresif",
        "Enggan berkoordinasi di grup komunikasi bersama",
      ],
      situationalDilemma:
        "Rekan kerjamu tidak menyelesaikan bagian tugasnya tepat waktu sehingga giliran tugasmu terhambat. Bagaimana cara kamu mengomunikasikannya kepadanya?",
    });
  }

  return {
    roleSummary: `Mencari anggota yang memiliki kompetensi teknis yang adaptif serta etos kerja tangguh, berinisiatif tinggi, dan dapat diandalkan terutama pada saat periode sibuk tim.`,
    domainWeight: 50,
    implicitWeight: 50,
    domainCriteria: domainCriteria.slice(0, 3),
    implicitCriteria: implicitCriteria.slice(0, 3),
  };
}

export async function translateRequirementsWithAi(
  rawPrompt: string,
  cultureDescription?: string
): Promise<ScoringRubric> {
  const model = getAiModel("AI_MODEL_TRANSLATOR", "gemini-2.5-flash");

  if (!model) {
    return generateFallbackRubric(rawPrompt);
  }

  const cultureContext = cultureDescription?.trim()
    ? `\n\nNILAI DAN BUDAYA ORGANISASI / PERUSAHAAN (Culture DNA):\n"""\n${cultureDescription.trim()}\n"""\nPastikan kriteria implicit dan dilema situasional selaras dengan nilai dan budaya kerja di atas.`
    : "";

  try {
    const result = await generateObject({
      model,
      schema: ScoringRubricSchema,
      system: TRANSLATOR_SYSTEM_PROMPT,
      prompt: `Berikut adalah kebutuhan rekruitmen dari Lab Lead / Manajer dalam bahasa Indonesia sehari-hari:
"""
${rawPrompt}
"""${cultureContext}

Terjemahkan kebutuhan ini menjadi ScoringRubric yang komprehensif, terstruktur, dan siap pakai untuk sesi interview kandidat.`,
    });

    // Ensure weights add up to 100
    const rubric = result.object;
    if (rubric.domainWeight + rubric.implicitWeight !== 100) {
      rubric.implicitWeight = 100 - rubric.domainWeight;
    }

    return rubric;
  } catch (error) {
    console.warn("AI generation failed or not configured, falling back to heuristic generator:", error);
    return generateFallbackRubric(rawPrompt);
  }
}
