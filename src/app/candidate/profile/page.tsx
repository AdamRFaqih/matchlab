import { getSession } from "@/lib/auth/session";
import { getCandidateDashboardData } from "@/modules/candidate/service";
import { CandidateProfileForm } from "@/modules/candidate/components/CandidateProfileForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profil & CV Terpadu | MatchLab",
  description: "Kelola profil MatchLab, riwayat pengalaman, keahlian, dan opsi visibilitas Talent Pool.",
};

export default async function CandidateProfilePage() {
  const sessionUser = await getSession();
  const userId = sessionUser?.id || "usr-dewi";
  const data = await getCandidateDashboardData(userId);

  const profile = data.profile || {
    userId,
    name: sessionUser?.name || "Job Seeker",
    email: sessionUser?.email || "candidate@example.com",
    cvSummaryText: "",
    skills: [],
    portfolioUrl: null,
    isOpenToPool: true,
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Pengaturan Profil & CV Pelamar
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Perbarui informasi Anda satu kali untuk digunakan secara konsisten pada semua lowongan pekerjaan yang Anda lamar.
        </p>
      </div>

      <CandidateProfileForm initialProfile={profile} />
    </div>
  );
}
