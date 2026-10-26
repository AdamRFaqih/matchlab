import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Sparkles,
  Building2,
  Lock,
  UserPlus,
  LogIn,
  AlertCircle,
  Briefcase,
  ShieldAlert,
} from "lucide-react";
import { findJobForScreening } from "@/modules/screening/repository";
import { ScreeningFlow } from "@/modules/screening/components/ScreeningFlow";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { buttonVariants } from "@/components/ui/button";

interface ApplyPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: ApplyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const job = await findJobForScreening(slug);

  if (!job) {
    return {
      title: "Posisi Tidak Ditemukan",
    };
  }

  return {
    title: `Lamar: ${job.title} | ${job.organization.name}`,
    description: `Ikuti wawancara screening AI MatchLab untuk posisi ${job.title} di ${job.organization.name}.`,
  };
}

export default async function ApplyPage({ params }: ApplyPageProps) {
  const { slug } = await params;
  const [job, currentUser] = await Promise.all([
    findJobForScreening(slug),
    getSession(),
  ]);

  if (!job) {
    notFound();
  }

  const isClosed = !job.isActive || job.organization.isSuspended;

  if (isClosed) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 bg-muted/20 text-center">
        <div className="max-w-md w-full bg-card border p-8 rounded-2xl shadow-xs space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Penerimaan Lamaran Ditutup</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Lowongan untuk posisi <strong>{job.title}</strong> di <strong>{job.organization.name}</strong> saat ini sedang tidak menerima pelamar baru.
          </p>
          <div className="pt-2">
            <Link href="/jobs" className={buttonVariants({ variant: "outline", className: "w-full gap-2" })}>
              <Briefcase className="w-4 h-4" />
              Cari Lowongan Lain di Bursa
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const generatedSpec = (job.generatedSpec as {
    roleSummary?: string;
    domainWeight?: number;
    implicitWeight?: number;
  }) || {};

  // 1. Unauthenticated Visitor
  if (!currentUser) {
    const applyUrl = `/apply/${job.slug}`;

    return (
      <div className="min-h-screen bg-muted/20 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center space-y-2 mb-6">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl tracking-tight mb-2">
            <span className="p-2 rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Sparkles className="w-5 h-5" />
            </span>
            <span>MatchLab</span>
          </Link>
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground font-medium">
            <Building2 className="w-3.5 h-3.5" />
            <span>{job.organization.name}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {job.title}
          </h1>
          {generatedSpec.roleSummary && (
            <p className="text-xs text-muted-foreground max-w-lg mx-auto leading-relaxed pt-1">
              {generatedSpec.roleSummary}
            </p>
          )}
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-card border p-8 rounded-2xl shadow-xs space-y-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h2 className="text-base font-bold text-foreground">
                Masuk untuk Memulai Wawancara AI
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Anda memerlukan akun Pencari Kerja MatchLab untuk mengikuti sesi percakapan wawancara 8 giliran dan menyimpan skor evaluasi Anda.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Link
                href={`/signup?type=seeker&next=${encodeURIComponent(applyUrl)}`}
                className={buttonVariants({ className: "w-full gap-2" })}
              >
                <UserPlus className="w-4 h-4" />
                Daftar Akun Baru (Gratis)
              </Link>
              <Link
                href={`/login?next=${encodeURIComponent(applyUrl)}`}
                className={buttonVariants({ variant: "outline", className: "w-full gap-2" })}
              >
                <LogIn className="w-4 h-4" />
                Sudah punya akun? Masuk
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Logged in as Company User (Not a Job Seeker)
  if (currentUser.systemRole !== "JOB_SEEKER") {
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col justify-center items-center py-12 px-4">
        <div className="max-w-md w-full bg-card border p-8 rounded-2xl shadow-xs text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Akun Organisasi Terdeteksi</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Anda saat ini masuk dengan akun tim organisasi (<strong>{currentUser.email}</strong>). Wawancara pelamar hanya dapat dilakukan menggunakan akun Pencari Kerja.
          </p>
          <div className="pt-2 space-y-2">
            <Link
              href={`/login?next=${encodeURIComponent(`/apply/${job.slug}`)}`}
              className={buttonVariants({ variant: "outline", className: "w-full" })}
            >
              Ganti ke Akun Pencari Kerja
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Unverified Job Seeker
  if (!currentUser.emailVerified) {
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col justify-center items-center py-12 px-4">
        <div className="max-w-md w-full bg-card border p-8 rounded-2xl shadow-xs text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Verifikasi Email Anda</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Sebelum memulai wawancara, silakan verifikasi alamat email Anda terlebih dahulu untuk memastikan hasil evaluasi dapat terhubung dengan aman.
          </p>
          <div className="pt-2">
            <Link
              href={`/verify-email?next=${encodeURIComponent(`/apply/${job.slug}`)}`}
              className={buttonVariants({ className: "w-full" })}
            >
              Buka Halaman Verifikasi Email
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Verified Job Seeker - Load Candidate Profile
  const candidateProfile = await db.candidateProfile.findUnique({
    where: { userId: currentUser.id },
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card/60 backdrop-blur sticky top-0 z-30">
        <div className="container max-w-5xl mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Link href="/" className="font-extrabold text-base tracking-tight hover:opacity-80">
              MatchLab
            </Link>
            <span className="text-muted-foreground text-xs">• Wawancara AI</span>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            {job.organization.name}
          </span>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto py-6 flex-1">
        <ScreeningFlow
          job={{
            title: job.title,
            slug: job.slug,
            organization: { name: job.organization.name },
            maxTurns: job.maxTurns,
            generatedSpec,
          }}
          initialCandidateProfile={{
            fullName: currentUser.name,
            email: currentUser.email,
            cvSummaryText: candidateProfile?.cvSummaryText || "",
            portfolioUrl: candidateProfile?.portfolioUrl || "",
          }}
        />
      </main>
    </div>
  );
}
