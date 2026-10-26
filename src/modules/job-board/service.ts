import { db } from "@/lib/db";
import type { JobBoardData, PublicJobItem, PublicCompanyOption } from "./types";

const FALLBACK_JOBS: PublicJobItem[] = [
  {
    id: "job-1",
    title: "Senior Systems & Cloud Infrastructure Engineer",
    slug: "aselab-senior-systems",
    roleSummary:
      "Membangun dan memelihara infrastruktur server lab, container orchestration Docker, dan pipeline komputasi terdistribusi.",
    requiredSkills: ["Docker", "Linux Kernel", "Go", "PostgreSQL"],
    maxTurns: 8,
    createdAt: new Date("2026-02-01"),
    organization: {
      id: "org-1",
      name: "ASE Research Lab",
      slug: "aselab",
      cultureDescription:
        "Autonomous software engineering laboratory conducting cutting-edge distributed systems and AI systems research with high rigor and team accountability.",
      isVerified: true,
    },
    applicantCount: 3,
  },
  {
    id: "job-2",
    title: "Fullstack Product Engineer (Next.js & TypeScript)",
    slug: "nusantara-fullstack-dev",
    roleSummary:
      "Mengembangkan antarmuka aplikasi finansial modern, integrasi payment gateway, dan backend microservices berlatensi rendah.",
    requiredSkills: ["Next.js", "TypeScript", "Tailwind CSS", "Node.js"],
    maxTurns: 8,
    createdAt: new Date("2026-02-10"),
    organization: {
      id: "org-2",
      name: "Nusantara Tech Startup",
      slug: "nusantara-tech",
      cultureDescription:
        "High-growth Southeast Asian fintech startup championing customer obsession, fast execution, and modern cloud technologies.",
      isVerified: true,
    },
    applicantCount: 2,
  },
];

const FALLBACK_COMPANIES: PublicCompanyOption[] = [
  { id: "org-1", name: "ASE Research Lab", slug: "aselab" },
  { id: "org-2", name: "Nusantara Tech Startup", slug: "nusantara-tech" },
];

export async function getPublicJobBoardData(): Promise<JobBoardData> {
  try {
    const [jobsRaw, companiesRaw] = await Promise.all([
      db.jobRequisition.findMany({
        where: {
          isActive: true,
          organization: {
            isVerified: true,
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
          isVerified: true,
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
  } catch (error) {
    console.warn("Could not query DB for public jobs, using fallback mock data:", error);
    return {
      jobs: FALLBACK_JOBS,
      companies: FALLBACK_COMPANIES,
    };
  }
}
