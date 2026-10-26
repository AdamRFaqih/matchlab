import { getPublicJobBoardData } from "@/modules/job-board/service";
import { PublicJobBoardView } from "@/modules/job-board/components/PublicJobBoardView";
import { getSession } from "@/lib/auth/session";
import { RoleSwitcher } from "@/components/auth/RoleSwitcher";
import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bursa Lowongan & Talent Marketplace | MatchLab",
  description:
    "Eksplorasi lowongan aktif di berbagai organisasi & lab terverifikasi, lalu ikuti wawancara screening AI instan.",
};

export default async function PublicJobBoardPage() {
  const [data, currentUser] = await Promise.all([
    getPublicJobBoardData(),
    getSession(),
  ]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-7xl mx-auto flex h-14 items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg">
              <span className="bg-primary text-primary-foreground p-1 rounded-md">
                <Sparkles className="w-4 h-4" />
              </span>
              MatchLab
            </Link>
            <nav className="flex items-center gap-4 text-sm font-medium">
              <Link
                href="/jobs"
                className="text-foreground font-semibold hover:text-foreground/80 transition-colors"
              >
                Bursa Lowongan
              </Link>
              <Link
                href="/candidate/dashboard"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Portal Pelamar
              </Link>
              <Link
                href="/dashboard"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard Tim
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <RoleSwitcher currentUser={currentUser} />
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Beranda
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 container max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border bg-muted/40 text-xs font-medium text-muted-foreground mb-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Talent Marketplace Terbuka
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Peluang Karir & Riset
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Lamar posisi impian Anda di lab riset dan startup teknologi dengan profil terpadu MatchLab. Selesaikan 8 giliran wawancara AI secara instan dan dapatkan penilaian objektif.
          </p>
        </div>

        <PublicJobBoardView initialData={data} currentUser={currentUser} />
      </main>
    </div>
  );
}
