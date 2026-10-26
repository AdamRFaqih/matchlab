"use server";

import { revalidatePath } from "next/cache";
import { assertOrgAccess, assertJobAccess, toActionError } from "@/lib/auth/guards";
import {
  translateRequirements,
  saveJobRequisition,
  toggleJobActive,
  deleteJob,
} from "./service";
import type {
  CreateJobRequisitionInput,
  SaveJobResult,
  TranslateRequirementsResult,
} from "./types";

export async function translateRequirementsAction(
  prompt: string,
  targetOrgId?: string
): Promise<TranslateRequirementsResult> {
  try {
    const ctx = await assertOrgAccess(targetOrgId);
    return await translateRequirements(prompt, ctx.organizationId);
  } catch (error) {
    return {
      success: false,
      error: toActionError(error, "Gagal menjalankan AI Translator."),
    };
  }
}

export async function saveJobRequisitionAction(
  input: CreateJobRequisitionInput
): Promise<SaveJobResult> {
  try {
    const ctx = await assertOrgAccess(input.organizationId);

    const result = await saveJobRequisition(
      {
        ...input,
        organizationId: ctx.organizationId,
      },
      {
        id: ctx.user.id,
        email: ctx.user.email,
      }
    );

    if (result.success) {
      revalidatePath("/dashboard");
      revalidatePath("/jobs");
    }

    return result;
  } catch (error) {
    return {
      success: false,
      error: toActionError(error, "Gagal membuat lowongan."),
    };
  }
}

export async function toggleJobActiveAction(
  jobId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await assertJobAccess(jobId);
    await toggleJobActive(jobId, ctx.organizationId, isActive, {
      id: ctx.user.id,
      email: ctx.user.email,
    });

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/jobs/${jobId}`);
    revalidatePath("/jobs");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: toActionError(error, "Gagal mengubah status lowongan."),
    };
  }
}

export async function deleteJobAction(
  jobId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await assertJobAccess(jobId, { adminOnly: true });
    await deleteJob(jobId, ctx.organizationId, {
      id: ctx.user.id,
      email: ctx.user.email,
    });

    revalidatePath("/dashboard");
    revalidatePath("/jobs");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: toActionError(error, "Gagal menghapus lowongan."),
    };
  }
}
