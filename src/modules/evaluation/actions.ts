"use server";

import { revalidatePath } from "next/cache";
import type { ApplicationStatus } from "@prisma/client";
import {
  evaluateCandidateTranscript,
  updateCandidateStatus,
} from "./service";
import type { EvaluateResult, UpdateStatusResult } from "./types";

export async function evaluateCandidateAction(
  candidateId: string,
  jobId?: string
): Promise<EvaluateResult> {
  const result = await evaluateCandidateTranscript(candidateId);
  if (jobId) {
    revalidatePath(`/dashboard/jobs/${jobId}`);
  }
  return result;
}

export async function updateCandidateStatusAction(
  candidateId: string,
  status: ApplicationStatus,
  jobId?: string
): Promise<UpdateStatusResult> {
  const result = await updateCandidateStatus(candidateId, status);
  if (jobId) {
    revalidatePath(`/dashboard/jobs/${jobId}`);
  }
  return result;
}
