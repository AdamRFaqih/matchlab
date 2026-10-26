import { PrismaClient, PlanTier, SystemRole, OrgRole, ApplicationStatus } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting MatchLab multi-tenant database seed...");

  // 1. Super Admin Account
  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@matchlab.id" },
    update: {
      name: "MatchLab Super Admin",
      systemRole: SystemRole.SUPER_ADMIN,
      isActive: true,
      passwordHash: hashPassword("admin123"),
    },
    create: {
      email: "admin@matchlab.id",
      name: "MatchLab Super Admin",
      passwordHash: hashPassword("admin123"),
      systemRole: SystemRole.SUPER_ADMIN,
      isActive: true,
    },
  });
  console.log(`✅ Super Admin created/updated: ${superAdmin.email}`);

  // 2. Organization 1: ASE Research Lab
  const aseOrg = await prisma.organization.upsert({
    where: { slug: "aselab" },
    update: {
      name: "ASE Research Lab",
      planTier: PlanTier.SME_PRO,
      applicantQuota: 250,
      cultureDescription:
        "Autonomous software engineering laboratory conducting cutting-edge distributed systems and AI systems research with high rigor and team accountability.",
      isVerified: true,
    },
    create: {
      name: "ASE Research Lab",
      slug: "aselab",
      planTier: PlanTier.SME_PRO,
      applicantQuota: 250,
      cultureDescription:
        "Autonomous software engineering laboratory conducting cutting-edge distributed systems and AI systems research with high rigor and team accountability.",
      isVerified: true,
    },
  });
  console.log(`✅ Organization created/updated: ${aseOrg.name} (${aseOrg.slug})`);

  // ASE Org Admin User
  const aseAdminUser = await prisma.user.upsert({
    where: { email: "hendra@aselab.id" },
    update: {
      name: "Dr. Hendra Wibowo",
      systemRole: SystemRole.COMPANY_USER,
      isActive: true,
      passwordHash: hashPassword("aselab123"),
    },
    create: {
      name: "Dr. Hendra Wibowo",
      email: "hendra@aselab.id",
      passwordHash: hashPassword("aselab123"),
      systemRole: SystemRole.COMPANY_USER,
      isActive: true,
    },
  });

  await prisma.organizationMember.upsert({
    where: {
      userId_organizationId: {
        userId: aseAdminUser.id,
        organizationId: aseOrg.id,
      },
    },
    update: { orgRole: OrgRole.ORG_ADMIN },
    create: {
      userId: aseAdminUser.id,
      organizationId: aseOrg.id,
      orgRole: OrgRole.ORG_ADMIN,
    },
  });

  // ASE Division Lead User
  const aseLeadUser = await prisma.user.upsert({
    where: { email: "budi@aselab.id" },
    update: {
      name: "Budi Santoso",
      systemRole: SystemRole.COMPANY_USER,
      isActive: true,
      passwordHash: hashPassword("aselab123"),
    },
    create: {
      name: "Budi Santoso",
      email: "budi@aselab.id",
      passwordHash: hashPassword("aselab123"),
      systemRole: SystemRole.COMPANY_USER,
      isActive: true,
    },
  });

  await prisma.organizationMember.upsert({
    where: {
      userId_organizationId: {
        userId: aseLeadUser.id,
        organizationId: aseOrg.id,
      },
    },
    update: { orgRole: OrgRole.DIVISION_LEAD },
    create: {
      userId: aseLeadUser.id,
      organizationId: aseOrg.id,
      orgRole: OrgRole.DIVISION_LEAD,
    },
  });

  // Sample Requisition for ASE Lab
  const aseJob = await prisma.jobRequisition.upsert({
    where: { slug: "aselab-senior-systems" },
    update: {
      title: "Senior Systems & Cloud Infrastructure Engineer",
      organizationId: aseOrg.id,
      rawUserPrompt: "Butuh engineer yang paham Docker, Linux kernel tuning, distributed KV store, dan siap jaga on-call lab.",
      maxTurns: 8,
      isActive: true,
      generatedSpec: {
        roleSummary: "Membangun dan memelihara infrastruktur server lab, container orchestration, dan pipeline komputasi terdistribusi.",
        domainWeight: 50,
        implicitWeight: 50,
        requiredSkills: ["Docker", "Linux Kernel", "Go", "PostgreSQL"],
      },
      scoringRubric: {
        domainWeight: 50,
        implicitWeight: 50,
        domainTraits: [
          { name: "Containerization & Linux", description: "Paham arsitektur Docker dan debugging sistem Linux", weight: 30 },
          { name: "Distributed Systems", description: "Mengerti konsep konsistensi dan replication", weight: 20 },
        ],
        implicitTraits: [
          { name: "Stress Tolerance & On-Call", description: "Ketenangan menghadapi outage sistem dan komunikasi proaktif", weight: 30 },
          { name: "Ownership", description: "Tanggung jawab penuh hingga perbaikan tuntas", weight: 20 },
        ],
        probeScenarios: [
          "Bagaimana langkah isolasi saat container menghabiskan seluruh memori host?",
          "Ceritakan pengalaman ketika sistem produksi down mendadak di luar jam kerja.",
          "Bagaimana cara Anda menyeimbangkan kualitas kode dengan deadline riset yang ketat?",
        ],
      },
    },
    create: {
      title: "Senior Systems & Cloud Infrastructure Engineer",
      slug: "aselab-senior-systems",
      organizationId: aseOrg.id,
      rawUserPrompt: "Butuh engineer yang paham Docker, Linux kernel tuning, distributed KV store, dan siap jaga on-call lab.",
      maxTurns: 8,
      isActive: true,
      generatedSpec: {
        roleSummary: "Membangun dan memelihara infrastruktur server lab, container orchestration, dan pipeline komputasi terdistribusi.",
        domainWeight: 50,
        implicitWeight: 50,
        requiredSkills: ["Docker", "Linux Kernel", "Go", "PostgreSQL"],
      },
      scoringRubric: {
        domainWeight: 50,
        implicitWeight: 50,
        domainTraits: [
          { name: "Containerization & Linux", description: "Paham arsitektur Docker dan debugging sistem Linux", weight: 30 },
          { name: "Distributed Systems", description: "Mengerti konsep konsistensi dan replication", weight: 20 },
        ],
        implicitTraits: [
          { name: "Stress Tolerance & On-Call", description: "Ketenangan menghadapi outage sistem dan komunikasi proaktif", weight: 30 },
          { name: "Ownership", description: "Tanggung jawab penuh hingga perbaikan tuntas", weight: 20 },
        ],
        probeScenarios: [
          "Bagaimana langkah isolasi saat container menghabiskan seluruh memori host?",
          "Ceritakan pengalaman ketika sistem produksi down mendadak di luar jam kerja.",
          "Bagaimana cara Anda menyeimbangkan kualitas kode dengan deadline riset yang ketat?",
        ],
      },
    },
  });
  console.log(`✅ Job Requisition created/updated: ${aseJob.title}`);

  // 3. Organization 2: Nusantara Tech Startup
  const nusantaraOrg = await prisma.organization.upsert({
    where: { slug: "nusantara-tech" },
    update: {
      name: "Nusantara Tech Startup",
      planTier: PlanTier.PAY_PER_OPREC,
      applicantQuota: 100,
      cultureDescription:
        "High-growth Southeast Asian fintech startup championing customer obsession, fast execution, and modern cloud technologies.",
      isVerified: true,
    },
    create: {
      name: "Nusantara Tech Startup",
      slug: "nusantara-tech",
      planTier: PlanTier.PAY_PER_OPREC,
      applicantQuota: 100,
      cultureDescription:
        "High-growth Southeast Asian fintech startup championing customer obsession, fast execution, and modern cloud technologies.",
      isVerified: true,
    },
  });
  console.log(`✅ Organization created/updated: ${nusantaraOrg.name} (${nusantaraOrg.slug})`);

  // Nusantara Org Admin User
  const nusantaraAdminUser = await prisma.user.upsert({
    where: { email: "siti@nusantaratech.id" },
    update: {
      name: "Siti Rahma",
      systemRole: SystemRole.COMPANY_USER,
      isActive: true,
      passwordHash: hashPassword("nusantara123"),
    },
    create: {
      name: "Siti Rahma",
      email: "siti@nusantaratech.id",
      passwordHash: hashPassword("nusantara123"),
      systemRole: SystemRole.COMPANY_USER,
      isActive: true,
    },
  });

  await prisma.organizationMember.upsert({
    where: {
      userId_organizationId: {
        userId: nusantaraAdminUser.id,
        organizationId: nusantaraOrg.id,
      },
    },
    update: { orgRole: OrgRole.ORG_ADMIN },
    create: {
      userId: nusantaraAdminUser.id,
      organizationId: nusantaraOrg.id,
      orgRole: OrgRole.ORG_ADMIN,
    },
  });

  // Sample Requisition for Nusantara Tech
  const nusantaraJob = await prisma.jobRequisition.upsert({
    where: { slug: "nusantara-fullstack-dev" },
    update: {
      title: "Fullstack Product Engineer (Next.js & TypeScript)",
      organizationId: nusantaraOrg.id,
      rawUserPrompt: "Butuh fullstack dev yang jago React/Next.js, Tailwind, dan terbiasa deploy API cepat di cloud.",
      maxTurns: 8,
      isActive: true,
      generatedSpec: {
        roleSummary: "Mengembangkan antarmuka aplikasi finansial modern, integrasi payment gateway, dan backend microservices.",
        domainWeight: 50,
        implicitWeight: 50,
        requiredSkills: ["Next.js", "TypeScript", "Tailwind CSS", "Node.js"],
      },
      scoringRubric: {
        domainWeight: 50,
        implicitWeight: 50,
        domainTraits: [
          { name: "Frontend Mastery", description: "Penguasaan komponen reaktif Next.js dan performa web", weight: 30 },
          { name: "API & Data Modeling", description: "Desain RESTful API dan skema database relasional", weight: 20 },
        ],
        implicitTraits: [
          { name: "Velocity & Agility", description: "Kecepatan adaptasi dengan requirement produk yang dinamis", weight: 30 },
          { name: "User Empathy", description: "Kepedulian terhadap kemudahan pengguna akhir", weight: 20 },
        ],
        probeScenarios: [
          "Bagaimana Anda merancang state management untuk form checkout bertingkat?",
          "Ceritakan saat Anda harus merilis hotfix di tengah traffic pengguna yang tinggi.",
          "Bagaimana Anda menyikapi masukan desain yang kontradiktif antara tim produk dan sales?",
        ],
      },
    },
    create: {
      title: "Fullstack Product Engineer (Next.js & TypeScript)",
      slug: "nusantara-fullstack-dev",
      organizationId: nusantaraOrg.id,
      rawUserPrompt: "Butuh fullstack dev yang jago React/Next.js, Tailwind, dan terbiasa deploy API cepat di cloud.",
      maxTurns: 8,
      isActive: true,
      generatedSpec: {
        roleSummary: "Mengembangkan antarmuka aplikasi finansial modern, integrasi payment gateway, dan backend microservices.",
        domainWeight: 50,
        implicitWeight: 50,
        requiredSkills: ["Next.js", "TypeScript", "Tailwind CSS", "Node.js"],
      },
      scoringRubric: {
        domainWeight: 50,
        implicitWeight: 50,
        domainTraits: [
          { name: "Frontend Mastery", description: "Penguasaan komponen reaktif Next.js dan performa web", weight: 30 },
          { name: "API & Data Modeling", description: "Desain RESTful API dan skema database relasional", weight: 20 },
        ],
        implicitTraits: [
          { name: "Velocity & Agility", description: "Kecepatan adaptasi dengan requirement produk yang dinamis", weight: 30 },
          { name: "User Empathy", description: "Kepedulian terhadap kemudahan pengguna akhir", weight: 20 },
        ],
        probeScenarios: [
          "Bagaimana Anda merancang state management untuk form checkout bertingkat?",
          "Ceritakan saat Anda harus merilis hotfix di tengah traffic pengguna yang tinggi.",
          "Bagaimana Anda menyikapi masukan desain yang kontradiktif antara tim produk dan sales?",
        ],
      },
    },
  });
  console.log(`✅ Job Requisition created/updated: ${nusantaraJob.title}`);

  // 4. Job Seeker 1: Dewi Lestari
  const dewiUser = await prisma.user.upsert({
    where: { email: "dewi@example.com" },
    update: {
      name: "Dewi Lestari",
      systemRole: SystemRole.JOB_SEEKER,
      isActive: true,
      passwordHash: hashPassword("dewi123"),
    },
    create: {
      name: "Dewi Lestari",
      email: "dewi@example.com",
      passwordHash: hashPassword("dewi123"),
      systemRole: SystemRole.JOB_SEEKER,
      isActive: true,
    },
  });

  const dewiProfile = await prisma.candidateProfile.upsert({
    where: { userId: dewiUser.id },
    update: {
      cvSummaryText:
        "Fullstack & Cloud Engineer with 3 years experience building scalable Node.js and Next.js applications, Docker, and PostgreSQL.",
      portfolioUrl: "https://github.com/dewilestari",
      skills: ["Next.js", "TypeScript", "PostgreSQL", "Docker", "Tailwind CSS"],
      isOpenToPool: true,
    },
    create: {
      userId: dewiUser.id,
      cvSummaryText:
        "Fullstack & Cloud Engineer with 3 years experience building scalable Node.js and Next.js applications, Docker, and PostgreSQL.",
      portfolioUrl: "https://github.com/dewilestari",
      skills: ["Next.js", "TypeScript", "PostgreSQL", "Docker", "Tailwind CSS"],
      isOpenToPool: true,
    },
  });
  console.log(`✅ Job Seeker 1 Profile created/updated: ${dewiUser.name}`);

  // Sample Application for Dewi
  const dewiApplication = await prisma.jobApplication.upsert({
    where: {
      jobId_candidateProfileId: {
        jobId: aseJob.id,
        candidateProfileId: dewiProfile.id,
      },
    },
    update: {
      status: ApplicationStatus.EVALUATED,
    },
    create: {
      jobId: aseJob.id,
      candidateProfileId: dewiProfile.id,
      status: ApplicationStatus.EVALUATED,
    },
  });

  await prisma.interviewSession.upsert({
    where: { applicationId: dewiApplication.id },
    update: {
      turnCount: 8,
      totalTokensUsed: 5820,
      completedAt: new Date(),
    },
    create: {
      applicationId: dewiApplication.id,
      turnCount: 8,
      totalTokensUsed: 5820,
      startedAt: new Date(Date.now() - 3600000),
      completedAt: new Date(),
      messages: [
        {
          id: "m1",
          role: "assistant",
          content: "Halo Dewi! Senang berkenalan dengan Anda. Bisakah Anda jelaskan pengalaman Anda seputar Docker dan troubleshooting server Linux?",
          timestamp: new Date(Date.now() - 3500000).toISOString(),
        },
        {
          id: "m2",
          role: "user",
          content: "Halo! Saya sudah 3 tahun mengelola container Docker di server Linux Ubuntu. Terbiasa debugging memori leak dengan cgroups, journalctl, dan htop.",
          timestamp: new Date(Date.now() - 3400000).toISOString(),
        },
      ],
    },
  });

  await prisma.evaluation.upsert({
    where: { applicationId: dewiApplication.id },
    update: {
      matchScore: 91,
      domainScore: 94,
      implicitBehaviorScore: 88,
      evalTokensUsed: 1240,
      executiveSummary:
        "Kandidat menunjukkan penguasaan kuat terhadap containerization dan Linux internals. Komunikasi tenang, metodis, dan terstruktur dalam skenario incident response.",
      greenFlags: ["Pengalaman praktis Linux & Docker kuat", "Rendah hati dan fokus pada akar masalah"],
      redFlags: [],
      finalInterviewProbes: ["Gali arsitektur cluster Kubernetes dan pipeline CI/CD yang pernah dikelola"],
      traitBreakdown: [
        { traitName: "Containerization & Linux", score: 95, reasoning: "Menjelaskan mekanisme isolasi container dan debugging cgroups dengan presisi." },
        { traitName: "Stress Tolerance & On-Call", score: 88, reasoning: "Memiliki prosedur yang jelas saat penanganan insiden darurat." },
      ],
    },
    create: {
      applicationId: dewiApplication.id,
      matchScore: 91,
      domainScore: 94,
      implicitBehaviorScore: 88,
      evalTokensUsed: 1240,
      executiveSummary:
        "Kandidat menunjukkan penguasaan kuat terhadap containerization dan Linux internals. Komunikasi tenang, metodis, dan terstruktur dalam skenario incident response.",
      greenFlags: ["Pengalaman praktis Linux & Docker kuat", "Rendah hati dan fokus pada akar masalah"],
      redFlags: [],
      finalInterviewProbes: ["Gali arsitektur cluster Kubernetes dan pipeline CI/CD yang pernah dikelola"],
      traitBreakdown: [
        { traitName: "Containerization & Linux", score: 95, reasoning: "Menjelaskan mekanisme isolasi container dan debugging cgroups dengan presisi." },
        { traitName: "Stress Tolerance & On-Call", score: 88, reasoning: "Memiliki prosedur yang jelas saat penanganan insiden darurat." },
      ],
    },
  });

  // 5. Job Seeker 2: Fajar Pratama
  const fajarUser = await prisma.user.upsert({
    where: { email: "fajar@example.com" },
    update: {
      name: "Fajar Pratama",
      systemRole: SystemRole.JOB_SEEKER,
      isActive: true,
      passwordHash: hashPassword("fajar123"),
    },
    create: {
      name: "Fajar Pratama",
      email: "fajar@example.com",
      passwordHash: hashPassword("fajar123"),
      systemRole: SystemRole.JOB_SEEKER,
      isActive: true,
    },
  });

  const fajarProfile = await prisma.candidateProfile.upsert({
    where: { userId: fajarUser.id },
    update: {
      cvSummaryText:
        "Undergraduate Computer Science researcher focusing on AI model evaluation, PyTorch, FastAPI, and data pipeline optimization.",
      portfolioUrl: "https://fajarpratama.dev",
      skills: ["Python", "FastAPI", "PyTorch", "Docker", "Machine Learning"],
      isOpenToPool: true,
    },
    create: {
      userId: fajarUser.id,
      cvSummaryText:
        "Undergraduate Computer Science researcher focusing on AI model evaluation, PyTorch, FastAPI, and data pipeline optimization.",
      portfolioUrl: "https://fajarpratama.dev",
      skills: ["Python", "FastAPI", "PyTorch", "Docker", "Machine Learning"],
      isOpenToPool: true,
    },
  });
  console.log(`✅ Job Seeker 2 Profile created/updated: ${fajarUser.name}`);

  // Sample Application for Fajar
  const fajarApplication = await prisma.jobApplication.upsert({
    where: {
      jobId_candidateProfileId: {
        jobId: nusantaraJob.id,
        candidateProfileId: fajarProfile.id,
      },
    },
    update: {
      status: ApplicationStatus.IN_PROGRESS,
    },
    create: {
      jobId: nusantaraJob.id,
      candidateProfileId: fajarProfile.id,
      status: ApplicationStatus.IN_PROGRESS,
    },
  });

  await prisma.interviewSession.upsert({
    where: { applicationId: fajarApplication.id },
    update: {
      turnCount: 4,
      totalTokensUsed: 2950,
      completedAt: null,
    },
    create: {
      applicationId: fajarApplication.id,
      turnCount: 4,
      totalTokensUsed: 2950,
      startedAt: new Date(Date.now() - 1800000),
      messages: [
        {
          id: "mf1",
          role: "assistant",
          content: "Halo Fajar! Selamat datang di sesi wawancara Nusantara Tech. Bagaimana pendekatan Anda saat merancang endpoint REST API berkecepatan tinggi?",
          timestamp: new Date(Date.now() - 1700000).toISOString(),
        },
        {
          id: "mf2",
          role: "user",
          content: "Halo! Saya biasa memakai FastAPI atau Next.js Route Handlers dengan connection pooling ke PostgreSQL serta caching di memory.",
          timestamp: new Date(Date.now() - 1600000).toISOString(),
        },
      ],
    },
  });

  console.log("✨ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
