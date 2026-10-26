import type { Metadata } from "next";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Bot,
  BrainCircuit,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  Users,
  Briefcase,
  Zap,
} from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { homePathFor } from "@/lib/auth/guards";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "MatchLab - SaaS Rekrutmen & AI Screening Cerdas",
  description:
    "Transformasikan proses rekrutmen tim Anda dengan AI Screening Interview 8-turn yang adaptif dan rubrik penilaian objektif.",
};

export default async function HomePage() {
  const user = await getSession();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />

      <main className="flex-1">
        {/* 1. HERO SECTION */}
        <section className="relative overflow-hidden pt-20 pb-24 md:pt-28 md:pb-32 border-b bg-radial-gradient">
          <div className="container max-w-7xl mx-auto px-4 sm:px-8 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border bg-muted/60 text-xs font-semibold text-primary shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>MatchLab Multi-Tenant SaaS v2.0</span>
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.1]">
              Screening Rekrutmen Cerdas dengan{" "}
              <span className="bg-gradient-to-r from-primary via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Wawancara AI
              </span>
            </h1>

            <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Ubah deskripsi santai menjadi rubrik terstruktur. Biarkan AI mewawancarai ratusan pelamar secara interaktif dan rangkum kecocokan kompetensi tanpa bias.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              {user ? (
                <Link
                  href={homePathFor(user)}
                  className={buttonVariants({ size: "lg", className: "rounded-xl px-6 h-12 gap-2 text-sm shadow-md" })}
                >
                  Buka Dashboard Saya
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/signup?type=company"
                    className={buttonVariants({ size: "lg", className: "rounded-xl px-6 h-12 gap-2 text-sm shadow-md" })}
                  >
                    Mulai Rekrut Gratis
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/jobs"
                    className={buttonVariants({ variant: "outline", size: "lg", className: "rounded-xl px-6 h-12 gap-2 text-sm" })}
                  >
                    <Briefcase className="w-4 h-4 text-primary" />
                    Jelajahi Lowongan Kerja
                  </Link>
                </>
              )}
            </div>

            <div className="pt-8 flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> Tanpa kartu kredit
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> 20 pelamar gratis
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> Setup dalam 2 menit
              </span>
            </div>
          </div>
        </section>

        {/* 2. HOW IT WORKS */}
        <section className="py-20 bg-muted/20 border-b">
          <div className="container max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <h2 className="text-xs font-bold tracking-widest text-primary uppercase">
                Alur Kerja Otomatis
              </h2>
              <h3 className="text-3xl font-extrabold tracking-tight">
                Tiga Langkah dari Lowongan hingga Kandidat Terbaik
              </h3>
              <p className="text-sm text-muted-foreground">
                Tinggalkan pemeriksaan manual ratusan CV statis. Fokuskan waktu tim Anda pada wawancara final.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-card border p-8 rounded-3xl space-y-4 shadow-xs relative">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                  1
                </div>
                <h4 className="text-lg font-bold">AI Requirement Translator</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Cukup ketik kebutuhan posisi dalam bahasa santai. AI langsung mengubahnya menjadi spesifikasi teknis dan rubrik penilaian kualifikasi terstruktur.
                </p>
              </div>

              <div className="bg-card border p-8 rounded-3xl space-y-4 shadow-xs relative">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                  2
                </div>
                <h4 className="text-lg font-bold">Wawancara Adaptif 8-Turn</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Setiap pelamar mengikuti sesi percakapan skenario selama 8 giliran. AI mengajukan pertanyaan probe mendalam yang disesuaikan dengan jawaban kandidat.
                </p>
              </div>

              <div className="bg-card border p-8 rounded-3xl space-y-4 shadow-xs relative">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-lg">
                  3
                </div>
                <h4 className="text-lg font-bold">Leaderboard & Decision Hub</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Dapatkan perankingan otomatis (skor 0–100), analisis green flags/red flags, serta rekomendasi pertanyaan lanjutan untuk tim HR dan Lead.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. CORE FEATURES */}
        <section className="py-20">
          <div className="container max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <h2 className="text-xs font-bold tracking-widest text-primary uppercase">
                Fitur Unggulan
              </h2>
              <h3 className="text-3xl font-extrabold tracking-tight">
                Didesain Khusus untuk Standar SaaS Perusahaan
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl border bg-card space-y-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary w-fit">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-base">Multi-Tenancy & Isolasi Ketat</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Data pelamar, konfigurasi lowongan, dan evaluasi terisolasi sempurna per organisasi dengan autentikasi berbasis sesi terenkripsi.
                </p>
              </div>

              <div className="p-6 rounded-2xl border bg-card space-y-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 w-fit">
                  <Users className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-base">Kolaborasi Tim & RBAC</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Undang rekan kerja dengan peran Org Admin atau Division Lead. Kontrol hak akses pembuatan lowongan dan review kandidat secara terpusat.
                </p>
              </div>

              <div className="p-6 rounded-2xl border bg-card space-y-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 w-fit">
                  <Zap className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-base">Pembayaran Otomatis Midtrans</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Beli kuota pay-per-oprec atau langganan bulanan SME Pro secara instan via QRIS, Virtual Account, dan e-wallet Indonesia.
                </p>
              </div>

              <div className="p-6 rounded-2xl border bg-card space-y-3">
                <div className="p-2.5 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 w-fit">
                  <Bot className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-base">Evaluasi Tanpa Halusinasi</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Model AI dipandu oleh skema Zod ketat yang mengevaluasi kompetensi domain dan perilaku tim tanpa bias nama, gender, atau almamater.
                </p>
              </div>

              <div className="p-6 rounded-2xl border bg-card space-y-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 w-fit">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-base">Profil Kandidat Reusable</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Pencari kerja memiliki satu profil terverifikasi yang dapat digunakan untuk melamar di berbagai perusahaan di bursa MatchLab.
                </p>
              </div>

              <div className="p-6 rounded-2xl border bg-card space-y-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 w-fit">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-base">Audit Log & Telemetri Token</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Pelacakan lengkap konsumsi token LLM dalam estimasi Rupiah serta log aktivitas administratif untuk akuntabilitas penuh.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. CALL TO ACTION */}
        <section className="py-20 border-t bg-primary text-primary-foreground">
          <div className="container max-w-5xl mx-auto px-4 sm:px-8 text-center space-y-6">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Siap Merekrut Talenta Terbaik Lebih Cepat?
            </h2>
            <p className="text-base sm:text-lg text-primary-foreground/80 max-w-2xl mx-auto leading-relaxed">
              Mulai dengan paket Gratis Starter kami hari ini. Buat lowongan pertama Anda dan undang kandidat dalam hitungan menit.
            </p>
            <div className="pt-2">
              <Link
                href="/signup?type=company"
                className={buttonVariants({
                  size: "lg",
                  variant: "secondary",
                  className: "rounded-xl px-8 h-12 gap-2 text-sm font-bold shadow-lg",
                })}
              >
                Daftarkan Organisasi Anda
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
