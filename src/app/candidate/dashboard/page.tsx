import type { Metadata } from "next";
import Link from "next/link";
import { User, Sparkles, ArrowRight, AlertCircle } from "lucide-react";
import { requireJobSeeker } from "@/lib/auth/guards";
import { getCandidateDashboardData } from "@/modules/candidate/service";
import { CandidateApplicationsList } from "@/modules/candidate/components/CandidateApplicationsList";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard Pelamar",
  description: "Pantau status lamaran kerja, sesi wawancara AI, dan feedback evaluasi kompetensi.",
};

export default async function CandidateDashboardPage() {
  const sessionUser = await requireJobSeeker("/candidate/dashboard");
  const data = await getCandidateDashboardData(sessionUser.id);

  const isProfileIncomplete = !data.profile?.cvSummaryText || data.profile.cvSummaryText.length < 10;

  return (
    <div className="space-y-6">
      {/* Header with Quick Profile Snapshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border bg-muted/40 text-xs font-medium text-muted-foreground mb-1">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Portal Pencari Kerja
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Dashboard Pelamar: {data.profile?.name || sessionUser.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Lacak seluruh proses wawancara AI dan perkembangan lamaran Anda di semua organisasi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/candidate/profile"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs gap-1.5")}
          >
            <User className="w-3.5 h-3.5" />
            Kelola Profil & CV
          </Link>
          <Link
            href="/jobs"
            className={cn(buttonVariants({ size: "sm" }), "text-xs gap-1.5")}
          >
            Lamar Posisi Baru
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {isProfileIncomplete && (
        <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Profil & ringkasan CV Anda belum lengkap. Lengkapi profil agar data kualifikasi Anda otomatis terisi saat melamar.
            </span>
          </div>
          <Link
            href="/candidate/profile"
            className={cn(buttonVariants({ size: "sm", variant: "outline" }), "text-xs shrink-0 bg-background")}
          >
            Lengkapi Profil Sekarang →
          </Link>
        </div>
      )}

      {/* Main Content Area */}
      <CandidateApplicationsList
        applications={data.applications}
        stats={data.stats}
      />
    </div>
  );
}
