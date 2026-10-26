import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function getOrCreateDefaultOrganization() {
  const existing = await db.organization.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (existing) {
    return existing;
  }

  return await db.organization.create({
    data: {
      name: "ASE Lab",
      slug: "aselab",
      planTier: "PAY_PER_OPREC",
      applicantQuota: 100,
    },
  });
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function generateUniqueJobSlug(title: string): Promise<string> {
  const baseSlug = slugify(title) || "job-opening";
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await db.jobRequisition.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter++}`;
  }
}

export interface CreateRequisitionParams {
  organizationId?: string;
  title: string;
  slug?: string;
  rawUserPrompt: string;
  generatedSpec: Prisma.InputJsonValue;
  scoringRubric: Prisma.InputJsonValue;
  maxTurns?: number;
}

export async function createJobRequisition(params: CreateRequisitionParams) {
  let orgId = params.organizationId;

  if (!orgId) {
    const org = await getOrCreateDefaultOrganization();
    orgId = org.id;
  }

  const finalSlug = params.slug || (await generateUniqueJobSlug(params.title));

  return await db.jobRequisition.create({
    data: {
      organizationId: orgId,
      title: params.title,
      slug: finalSlug,
      rawUserPrompt: params.rawUserPrompt,
      generatedSpec: params.generatedSpec,
      scoringRubric: params.scoringRubric,
      maxTurns: params.maxTurns ?? 8,
      isActive: true,
    },
  });
}

export async function getJobRequisitionBySlug(slug: string) {
  return await db.jobRequisition.findUnique({
    where: { slug },
    include: {
      organization: true,
    },
  });
}

export async function getJobRequisitionById(id: string) {
  return await db.jobRequisition.findUnique({
    where: { id },
    include: {
      organization: true,
    },
  });
}

export async function listJobRequisitions(organizationId?: string) {
  return await db.jobRequisition.findMany({
    where: organizationId ? { organizationId } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { candidates: true },
      },
    },
  });
}
