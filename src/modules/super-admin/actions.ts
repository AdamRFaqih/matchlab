"use server";

import { revalidatePath } from "next/cache";
import type { PlanTier } from "@prisma/client";
import { assertSuperAdmin, toActionError } from "@/lib/auth/guards";
import {
  toggleOrgVerification,
  toggleOrgSuspension,
  updateOrgPlan,
  updateOrgQuota,
  toggleUserStatus,
} from "./service";

export async function toggleOrganizationVerificationAction(
  orgId: string,
  isVerified: boolean
) {
  try {
    const admin = await assertSuperAdmin();
    await toggleOrgVerification(orgId, isVerified, { id: admin.id, email: admin.email });
    revalidatePath("/super-admin");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: toActionError(error, "Gagal mengubah status verifikasi."),
    };
  }
}

export async function toggleOrganizationSuspensionAction(
  orgId: string,
  isSuspended: boolean
) {
  try {
    const admin = await assertSuperAdmin();
    await toggleOrgSuspension(orgId, isSuspended, { id: admin.id, email: admin.email });
    revalidatePath("/super-admin");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: toActionError(error, "Gagal mengubah status penangguhan."),
    };
  }
}

export async function updateOrganizationPlanAction(
  orgId: string,
  planTier: PlanTier,
  applicantQuota: number,
  periodDays?: number
) {
  try {
    const admin = await assertSuperAdmin();
    await updateOrgPlan(orgId, planTier, applicantQuota, { id: admin.id, email: admin.email }, periodDays);
    revalidatePath("/super-admin");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: toActionError(error, "Gagal memperbarui paket organisasi."),
    };
  }
}

export async function updateOrganizationQuotaAction(
  orgId: string,
  applicantQuota: number
) {
  try {
    const admin = await assertSuperAdmin();
    await updateOrgQuota(orgId, applicantQuota, { id: admin.id, email: admin.email });
    revalidatePath("/super-admin");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: toActionError(error, "Gagal memperbarui kuota organisasi."),
    };
  }
}

export async function toggleUserStatusAction(userId: string, isActive: boolean) {
  try {
    const admin = await assertSuperAdmin();
    await toggleUserStatus(userId, isActive, { id: admin.id, email: admin.email });
    revalidatePath("/super-admin");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: toActionError(error, "Gagal mengubah status akun pengguna."),
    };
  }
}
