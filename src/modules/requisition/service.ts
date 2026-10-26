import { db } from "@/lib/db";
import { translateRequirementsWithAi } from "@/lib/ai/translator";
import {
  CreateJobRequisitionInputSchema,
  ScoringRubricSchema,
  type CreateJobRequisitionInput,
} from "@/lib/ai/schemas";
import {
  createJobRequisition,
  generateUniqueJobSlug,
} from "./repository";
import type {
  SaveJobResult,
  TranslateRequirementsResult,
} from "./types";

export async function translateRequirements(
  rawPrompt: string,
  organizationId?: string
): Promise<TranslateRequirementsResult> {
  const trimmed = rawPrompt.trim();
  if (trimmed.length < 10) {
    return {
      success: false,
      error: "Deskripsi kebutuhan minimal 10 karakter agar AI dapat menganalisis konteks posisi.",
    };
  }

  let cultureDescription: string | undefined;
  if (organizationId) {
    try {
      const org = await db.organization.findUnique({
        where: { id: organizationId },
        select: { cultureDescription: true },
      });
      cultureDescription = org?.cultureDescription || undefined;
    } catch (e) {
      console.warn("Could not fetch org culture:", e);
    }
  }

  try {
    const rawRubric = await translateRequirementsWithAi(trimmed, cultureDescription);
    const validatedRubric = ScoringRubricSchema.parse(rawRubric);

    return {
      success: true,
      rubric: validatedRubric,
    };
  } catch (err) {
    console.error("Failed to translate requirements:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal menerjemahkan kebutuhan dengan AI.",
    };
  }
}

export async function saveJobRequisition(
  input: CreateJobRequisitionInput
): Promise<SaveJobResult> {
  try {
    const validated = CreateJobRequisitionInputSchema.parse(input);

    if (validated.scoringRubric.domainWeight + validated.scoringRubric.implicitWeight !== 100) {
      return {
        success: false,
        error: "Total bobot domain dan implicit harus tepat 100%.",
      };
    }

    const slug = validated.slug || (await generateUniqueJobSlug(validated.title));

    const generatedSpec = {
      title: validated.title,
      roleSummary: validated.scoringRubric.roleSummary,
      domainWeight: validated.scoringRubric.domainWeight,
      implicitWeight: validated.scoringRubric.implicitWeight,
      targetAudience: "Mahasiswa / Pelamar Umum",
    };

    const job = await createJobRequisition({
      organizationId: validated.organizationId,
      title: validated.title,
      slug,
      rawUserPrompt: validated.rawUserPrompt,
      generatedSpec,
      scoringRubric: validated.scoringRubric,
      maxTurns: validated.maxTurns,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    const shareableUrl = `${appUrl}/apply/${job.slug}`;

    return {
      success: true,
      jobId: job.id,
      slug: job.slug,
      shareableUrl,
    };
  } catch (err) {
    console.error("Failed to save job requisition:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal menyimpan job requisition ke database.",
    };
  }
}
