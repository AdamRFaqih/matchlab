import type { Metadata } from "next";
import { requireJobSeeker } from "@/lib/auth/guards";
import { getCandidateDashboardData } from "@/modules/candidate/service";
import { CandidateProfileForm } from "@/modules/candidate/components/CandidateProfileForm";

export const metadata: Metadata = {
  title: "Profil & CV Terpadu",
  description: "Kelola profil MatchLab, riwayat pengalaman, keahlian, dan opsi visibilitas Talent Pool.",
};

export default async function CandidateProfilePage() {
  const sessionUser = await requireJobSeeker("/candidate/profile");
  const data = await getCandidateDashboardData(sessionUser.id);

  const profile = data.profile || {
    userId: sessionUser.id,
    name: sessionUser.name,
    email: sessionUser.email,
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
          Perbarui informasi Anda satu kali untuk digunakan secara konsisten pada seluruh lowongan pekerjaan yang Anda lamar.
        </p>
      </div>

      <CandidateProfileForm initialProfile={profile} />
    </div>
  );
}
