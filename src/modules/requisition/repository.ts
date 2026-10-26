import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "job-opening";
}

export async function generateUniqueJobSlug(title: string): Promise<string> {
  const baseSlug = slugify(title);
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
  organizationId: string;
  title: string;
  slug?: string;
  rawUserPrompt: string;
  generatedSpec: Prisma.InputJsonValue;
  scoringRubric: Prisma.InputJsonValue;
  maxTurns?: number;
}

export async function createJobRequisition(params: CreateRequisitionParams) {
  const finalSlug = params.slug || (await generateUniqueJobSlug(params.title));

  return await db.jobRequisition.create({
    data: {
      organizationId: params.organizationId,
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

export async function listJobRequisitions(organizationId: string) {
  return await db.jobRequisition.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { applications: true },
      },
    },
  });
}

export async function setJobActiveState(id: string, organizationId: string, isActive: boolean) {
  return await db.jobRequisition.updateMany({
    where: { id, organizationId },
    data: { isActive },
  });
}

export async function deleteJobRequisition(id: string, organizationId: string) {
  return await db.jobRequisition.deleteMany({
    where: { id, organizationId },
  });
}
