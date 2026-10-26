"use server";

import {
  translateRequirements,
  saveJobRequisition,
} from "./service";
import type {
  CreateJobRequisitionInput,
  SaveJobResult,
  TranslateRequirementsResult,
} from "./types";

export async function translateRequirementsAction(
  prompt: string
): Promise<TranslateRequirementsResult> {
  return await translateRequirements(prompt);
}

export async function saveJobRequisitionAction(
  input: CreateJobRequisitionInput
): Promise<SaveJobResult> {
  return await saveJobRequisition(input);
}
