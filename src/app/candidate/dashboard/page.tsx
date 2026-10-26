import { getSession } from "@/lib/auth/session";
import { getCandidateDashboardData } from "@/modules/candidate/service";
import { CandidateApplicationsList } from "@/modules/candidate/components/CandidateApplicationsList";
import Link from "next/link";
import { User, Sparkles, ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portal Pelamar (Job Seeker) | MatchLab",
  description: "Pantau status lamaran kerja, sesi wawancara AI, dan feedback evaluasi kompetensi.",
};

export default async function CandidateDashboardPage() {
  const sessionUser = await getSession();
  const userId = sessionUser?.id || "usr-dewi";
  const data = await getCandidateDashboardData(userId);

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
            Dashboard Pelamar: {data.profile?.name || sessionUser?.name}
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

      {/* Applications List & Stats */}
      <CandidateApplicationsList
        applications={data.applications}
        stats={data.stats}
      />
    </div>
  );
}
