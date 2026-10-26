import type { Metadata } from "next";
import { getPublicJobBoardData } from "@/modules/job-board/service";
import { PublicJobBoardView } from "@/modules/job-board/components/PublicJobBoardView";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bursa Lowongan Kerja",
  description:
    "Eksplorasi lowongan aktif di berbagai organisasi & lab terverifikasi, lalu ikuti wawancara screening AI instan.",
};

export default async function PublicJobBoardPage() {
  const data = await getPublicJobBoardData();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <PublicHeader />

      <main className="flex-1 container max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        <PublicJobBoardView initialData={data} />
      </main>

      <SiteFooter />
    </div>
  );
}
