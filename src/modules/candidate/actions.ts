"use server";

import { revalidatePath } from "next/cache";
import { saveCandidateProfile } from "./service";

export async function saveCandidateProfileAction(params: {
  userId: string;
  name: string;
  cvSummaryText: string;
  skills: string[];
  portfolioUrl?: string | null;
  isOpenToPool: boolean;
}) {
  try {
    if (!params.name.trim()) {
      return { success: false, error: "Nama lengkap tidak boleh kosong." };
    }
    if (params.cvSummaryText.trim().length < 10) {
      return {
        success: false,
        error: "Ringkasan CV & pengalaman minimal 10 karakter.",
      };
    }

    await saveCandidateProfile(params.userId, {
      name: params.name.trim(),
      cvSummaryText: params.cvSummaryText.trim(),
      skills: params.skills,
      portfolioUrl: params.portfolioUrl?.trim() || null,
      isOpenToPool: params.isOpenToPool,
    });

    revalidatePath("/candidate/profile");
    revalidatePath("/candidate/dashboard");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menyimpan profil.",
    };
  }
}
