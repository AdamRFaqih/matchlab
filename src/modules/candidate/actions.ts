"use server";

import { revalidatePath } from "next/cache";
import { assertJobSeeker, toActionError } from "@/lib/auth/guards";
import { recordAudit, AuditAction } from "@/lib/audit";
import { saveCandidateProfile } from "./service";

export async function saveCandidateProfileAction(params: {
  name: string;
  cvSummaryText: string;
  skills: string[];
  portfolioUrl?: string | null;
  isOpenToPool: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const seeker = await assertJobSeeker();

    if (!params.name || !params.name.trim()) {
      return { success: false, error: "Nama lengkap tidak boleh kosong." };
    }
    if (!params.cvSummaryText || params.cvSummaryText.trim().length < 10) {
      return {
        success: false,
        error: "Ringkasan CV & pengalaman minimal 10 karakter.",
      };
    }

    if (params.portfolioUrl && params.portfolioUrl.trim()) {
      const url = params.portfolioUrl.trim();
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        return { success: false, error: "Tautan portofolio harus diawali http:// atau https://" };
      }
    }

    await saveCandidateProfile(seeker.id, {
      name: params.name.trim(),
      cvSummaryText: params.cvSummaryText.trim(),
      skills: params.skills,
      portfolioUrl: params.portfolioUrl?.trim() || null,
      isOpenToPool: params.isOpenToPool,
    });

    await recordAudit({
      action: AuditAction.USER_PROFILE_UPDATED,
      actorId: seeker.id,
      actorEmail: seeker.email,
      targetType: "CandidateProfile",
      targetId: seeker.candidateProfileId,
    });

    revalidatePath("/candidate/profile");
    revalidatePath("/candidate/dashboard");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: toActionError(error, "Gagal menyimpan profil."),
    };
  }
}
