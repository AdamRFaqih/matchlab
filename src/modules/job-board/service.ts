import { db } from "@/lib/db";
import type { JobBoardData, PublicJobItem } from "./types";

export async function getPublicJobBoardData(): Promise<JobBoardData> {
  const [jobsRaw, companiesRaw] = await Promise.all([
    db.jobRequisition.findMany({
      where: {
        isActive: true,
        organization: {
          isSuspended: false,
        },
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            cultureDescription: true,
            isVerified: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.organization.findMany({
      where: {
        isSuspended: false,
        jobs: {
          some: {
            isActive: true,
          },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const jobs: PublicJobItem[] = jobsRaw.map((j) => {
    const spec = j.generatedSpec as {
      roleSummary?: string;
      requiredSkills?: string[];
    };

    return {
      id: j.id,
      title: j.title,
      slug: j.slug,
      roleSummary:
        spec?.roleSummary ||
        "Mencari talenta berpotensi tinggi dengan keahlian teknis relevan dan dedikasi tim kuat.",
      requiredSkills: Array.isArray(spec?.requiredSkills) ? spec.requiredSkills : [],
      maxTurns: j.maxTurns,
      createdAt: j.createdAt,
      organization: j.organization,
      applicantCount: j._count.applications,
    };
  });

  return {
    jobs,
    companies: companiesRaw,
  };
}
