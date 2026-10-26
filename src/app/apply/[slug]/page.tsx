import { notFound } from "next/navigation";
import { findJobForScreening } from "@/modules/screening/repository";
import { ScreeningFlow } from "@/modules/screening/components/ScreeningFlow";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import type { Metadata } from "next";

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
      title: "Posisi Tidak Ditemukan | MatchLab",
    };
  }

  return {
    title: `Daftar: ${job.title} | ${job.organization.name}`,
    description: `Ikuti wawancara awal AI MatchLab untuk posisi ${job.title} di ${job.organization.name}.`,
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

  let candidateProfile = null;
  if (currentUser && currentUser.systemRole === "JOB_SEEKER") {
    try {
      candidateProfile = await db.candidateProfile.findUnique({
        where: { userId: currentUser.id },
      });
    } catch {
      // Fallback if offline
    }
  }

  const generatedSpec = (job.generatedSpec as {
    roleSummary?: string;
    domainWeight?: number;
    implicitWeight?: number;
  }) || {};

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/60 backdrop-blur">
        <div className="container max-w-5xl mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="font-extrabold text-base tracking-tight">MatchLab</div>
            <span className="text-muted-foreground text-xs">• Sesi Wawancara Kandidat</span>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            {job.organization.name}
          </span>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto py-4">
        <ScreeningFlow
          job={{
            title: job.title,
            slug: job.slug,
            organization: { name: job.organization.name },
            maxTurns: job.maxTurns,
            generatedSpec,
          }}
          initialCandidateProfile={
            currentUser?.systemRole === "JOB_SEEKER"
              ? {
                  fullName: currentUser.name,
                  email: currentUser.email,
                  cvSummaryText: candidateProfile?.cvSummaryText || "",
                  portfolioUrl: candidateProfile?.portfolioUrl || "",
                }
              : undefined
          }
        />
      </main>
    </div>
  );
}
