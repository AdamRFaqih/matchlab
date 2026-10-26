import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Sparkles, ArrowRight, Briefcase, User, Building2, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-12 bg-background text-foreground">
      <main className="max-w-3xl text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border bg-muted/50 text-xs font-medium text-muted-foreground">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          Multi-Tenant AI Talent Matchmaker & Marketplace
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
            MatchLab
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Platform penyaringan awal dua arah berbasis wawancara skenario AI. Ubah kebutuhan santai pimpinan tim menjadi rubrik objektif dan temukan talenta beretika kerja tangguh.
          </p>
        </div>

        {/* 4 Actors Navigation Hub */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-2">
          {/* 1. Job Seeker */}
          <Link
            href="/jobs"
            className="p-5 rounded-xl border bg-card hover:border-primary/50 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Briefcase className="w-5 h-5" />
              </span>
              <span className="text-xs font-semibold text-primary flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Eksplorasi <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <h3 className="font-bold text-base text-foreground">Bursa Lowongan Kerja</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Jelajahi lowongan aktif di ASE Lab dan Nusantara Tech, lalu lamar dengan profil terpadu MatchLab.
            </p>
          </Link>

          {/* 2. Candidate Portal */}
          <Link
            href="/candidate/dashboard"
            className="p-5 rounded-xl border bg-card hover:border-primary/50 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <User className="w-5 h-5" />
              </span>
              <span className="text-xs font-semibold text-primary flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Portal Pelamar <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <h3 className="font-bold text-base text-foreground">Dashboard & Profil Pelamar</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Kelola profil CV reusable, lanjutkan giliran wawancara AI, dan lihat umpan balik kekuatan AI Anda.
            </p>
          </Link>

          {/* 3. Company Lead / Admin */}
          <Link
            href="/dashboard"
            className="p-5 rounded-xl border bg-card hover:border-primary/50 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Building2 className="w-5 h-5" />
              </span>
              <span className="text-xs font-semibold text-primary flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Dashboard Tim <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <h3 className="font-bold text-base text-foreground">Dashboard Tim & Organisasi</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Kelola lowongan organisasi Anda, suntikkan Culture DNA, dan evaluasi leaderboard kandidat (Flow C).
            </p>
          </Link>

          {/* 4. Super Admin */}
          <Link
            href="/super-admin"
            className="p-5 rounded-xl border bg-card hover:border-primary/50 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Shield className="w-5 h-5" />
              </span>
              <span className="text-xs font-semibold text-primary flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Control Panel <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <h3 className="font-bold text-base text-foreground">Super Admin Control Panel</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Pantau KPI cross-tenant, biaya konsumsi token LLM dalam Rupiah, kuota pelamar, dan verifikasi tenant.
            </p>
          </Link>
        </div>

        <div className="flex justify-center pt-2">
          <Link
            href="/dashboard/jobs/new"
            className={cn(buttonVariants({ size: "lg" }), "font-semibold shadow-xs")}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Mulai Buat Lowongan AI (Flow A)
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </main>
    </div>
  );
}
