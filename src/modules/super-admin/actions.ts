"use server";

import { revalidatePath } from "next/cache";
import type { PlanTier } from "@prisma/client";
import {
  toggleOrgVerification,
  updateOrgPlan,
  toggleUserStatus,
} from "./service";

export async function toggleOrgVerificationAction(orgId: string, isVerified: boolean) {
  try {
    const updated = await toggleOrgVerification(orgId, isVerified);
    revalidatePath("/super-admin");
    return { success: true, isVerified: updated.isVerified };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal memperbarui status verifikasi",
    };
  }
}

export async function updateOrgPlanAction(
  orgId: string,
  planTier: PlanTier,
  applicantQuota: number
) {
  try {
    const quota = Math.max(1, Math.min(10000, Number(applicantQuota) || 100));
    await updateOrgPlan(orgId, planTier, quota);
    revalidatePath("/super-admin");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal memperbarui paket organisasi",
    };
  }
}

export async function toggleUserStatusAction(userId: string, isActive: boolean) {
  try {
    const updated = await toggleUserStatus(userId, isActive);
    revalidatePath("/super-admin");
    return { success: true, isActive: updated.isActive };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal memperbarui status pengguna",
    };
  }
}
