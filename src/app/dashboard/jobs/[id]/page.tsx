import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireOrgMember } from "@/lib/auth/guards";
import { getJobLeaderboardData } from "@/modules/evaluation/service";
import { LeaderboardView } from "@/modules/evaluation/components/LeaderboardView";

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
      title: "Lowongan Tidak Ditemukan",
    };
  }

  return {
    title: `Leaderboard: ${data.title}`,
    description: `Leaderboard hasil penyaringan AI untuk posisi ${data.title}.`,
  };
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;
  const ctx = await requireOrgMember();

  // If super admin, allow viewing any org's leaderboard; otherwise scope to ctx.organizationId
  const allowedOrgId = ctx.orgRole === "SUPER_ADMIN" ? undefined : ctx.organizationId;
  const data = await getJobLeaderboardData(id, allowedOrgId);

  if (!data) {
    notFound();
  }

  return <LeaderboardView initialData={data} />;
}
