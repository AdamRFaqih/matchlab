import { notFound } from "next/navigation";
import { findJobForScreening } from "@/modules/screening/repository";
import { ScreeningFlow } from "@/modules/screening/components/ScreeningFlow";
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
  const job = await findJobForScreening(slug);

  if (!job) {
    notFound();
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
        />
      </main>
    </div>
  );
}
