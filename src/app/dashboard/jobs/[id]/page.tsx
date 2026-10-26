import { notFound } from "next/navigation";
import { getJobLeaderboardData } from "@/modules/evaluation/service";
import { LeaderboardView } from "@/modules/evaluation/components/LeaderboardView";
import type { Metadata } from "next";

interface JobDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: JobDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await getJobLeaderboardData(id);

  if (!data) {
    return {
      title: "Job Requisition Tidak Ditemukan | MatchLab",
    };
  }

  return {
    title: `Leaderboard: ${data.title} | MatchLab`,
    description: `Leaderboard hasil penyaringan AI awal untuk posisi ${data.title}.`,
  };
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;
  const data = await getJobLeaderboardData(id);

  if (!data) {
    notFound();
  }

  return <LeaderboardView initialData={data} />;
}
