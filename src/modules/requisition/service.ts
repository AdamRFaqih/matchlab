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
  setJobActiveState,
  deleteJobRequisition as deleteJobInDb,
} from "./repository";
import { checkActiveJobLimit } from "@/lib/billing/quota";
import { rateLimit } from "@/lib/rate-limit";
import { recordAudit, AuditAction } from "@/lib/audit";
import type {
  SaveJobResult,
  TranslateRequirementsResult,
} from "./types";

export async function translateRequirements(
  rawPrompt: string,
  organizationId: string
): Promise<TranslateRequirementsResult> {
  const trimmed = rawPrompt.trim();
  if (trimmed.length < 10) {
    return {
      success: false,
      error: "Deskripsi kebutuhan minimal 10 karakter agar AI dapat menganalisis konteks posisi.",
    };
  }

  // Rate limit translations to prevent abuse: 30 calls per hour per organization
  const limitCheck = rateLimit(`ai-translate:${organizationId}`, 30, 60 * 60 * 1000);
  if (!limitCheck.ok) {
    return {
      success: false,
      error: `Batas penggunaan AI Translator tercapai. Coba lagi dalam ${limitCheck.retryAfterSeconds} detik.`,
    };
  }

  let cultureDescription: string | undefined;
  try {
    const org = await db.organization.findUnique({
      where: { id: organizationId },
      select: { cultureDescription: true },
    });
    cultureDescription = org?.cultureDescription || undefined;
  } catch (e) {
    console.warn("Could not fetch org culture:", e);
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
  input: CreateJobRequisitionInput & { organizationId: string },
  actor: { id: string; email: string }
): Promise<SaveJobResult> {
  try {
    const validated = CreateJobRequisitionInputSchema.parse(input);
    const orgId = input.organizationId;

    if (validated.scoringRubric.domainWeight + validated.scoringRubric.implicitWeight !== 100) {
      return {
        success: false,
        error: "Total bobot domain dan implicit harus tepat 100%.",
      };
    }

    // Check plan active job limit
    const limitError = await checkActiveJobLimit(orgId);
    if (limitError) {
      return {
        success: false,
        error: limitError,
      };
    }

    const slug = validated.slug || (await generateUniqueJobSlug(validated.title));

    const generatedSpec = {
      title: validated.title,
      roleSummary: validated.scoringRubric.roleSummary,
      domainWeight: validated.scoringRubric.domainWeight,
      implicitWeight: validated.scoringRubric.implicitWeight,
      targetAudience: "Pelamar Umum / Mahasiswa",
    };

    const job = await createJobRequisition({
      organizationId: orgId,
      title: validated.title,
      slug,
      rawUserPrompt: validated.rawUserPrompt,
      generatedSpec,
      scoringRubric: validated.scoringRubric,
      maxTurns: validated.maxTurns,
    });

    await recordAudit({
      action: AuditAction.JOB_CREATED,
      actorId: actor.id,
      actorEmail: actor.email,
      organizationId: orgId,
      targetType: "JobRequisition",
      targetId: job.id,
      metadata: { title: job.title, slug: job.slug },
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
      error: err instanceof Error ? err.message : "Gagal menyimpan lowongan ke database.",
    };
  }
}

export async function toggleJobActive(
  jobId: string,
  organizationId: string,
  isActive: boolean,
  actor: { id: string; email: string }
) {
  if (isActive) {
    const limitError = await checkActiveJobLimit(organizationId);
    if (limitError) {
      throw new Error(limitError);
    }
  }

  await setJobActiveState(jobId, organizationId, isActive);

  await recordAudit({
    action: AuditAction.JOB_STATUS_CHANGED,
    actorId: actor.id,
    actorEmail: actor.email,
    organizationId,
    targetType: "JobRequisition",
    targetId: jobId,
    metadata: { isActive },
  });
}

export async function deleteJob(
  jobId: string,
  organizationId: string,
  actor: { id: string; email: string }
) {
  await deleteJobInDb(jobId, organizationId);

  await recordAudit({
    action: AuditAction.JOB_DELETED,
    actorId: actor.id,
    actorEmail: actor.email,
    organizationId,
    targetType: "JobRequisition",
    targetId: jobId,
  });
}
