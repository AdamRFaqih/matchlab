"use server";

import { revalidatePath } from "next/cache";
import type { ApplicationStatus } from "@prisma/client";
import { assertApplicationAccess, toActionError } from "@/lib/auth/guards";
import { recordAudit, AuditAction } from "@/lib/audit";
import {
  evaluateCandidateTranscript,
  updateCandidateStatus,
} from "./service";
import type { EvaluateResult, UpdateStatusResult } from "./types";

export async function evaluateCandidateAction(
  applicationId: string,
  jobId?: string
): Promise<EvaluateResult> {
  try {
    await assertApplicationAccess(applicationId);
    const result = await evaluateCandidateTranscript(applicationId);
    if (jobId) {
      revalidatePath(`/dashboard/jobs/${jobId}`);
    }
    return result;
  } catch (error) {
    return {
      success: false,
      error: toActionError(error, "Gagal mengevaluasi kandidat."),
    };
  }
}

export async function updateCandidateStatusAction(
  applicationId: string,
  status: ApplicationStatus,
  jobId?: string
): Promise<UpdateStatusResult> {
  try {
    const ctx = await assertApplicationAccess(applicationId);
    const result = await updateCandidateStatus(applicationId, status);

    if (result.success) {
      await recordAudit({
        action: AuditAction.APPLICATION_STATUS_CHANGED,
        actorId: ctx.user.id,
        actorEmail: ctx.user.email,
        organizationId: ctx.organizationId,
        targetType: "JobApplication",
        targetId: applicationId,
        metadata: { newStatus: status },
      });
      if (jobId) {
        revalidatePath(`/dashboard/jobs/${jobId}`);
      }
    }

    return result;
  } catch (error) {
    return {
      success: false,
      error: toActionError(error, "Gagal memperbarui status kandidat."),
    };
  }
}
