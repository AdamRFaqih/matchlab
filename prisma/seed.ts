import crypto from "node:crypto";
import { PrismaClient, PlanTier, SystemRole, OrgRole, ApplicationStatus, InvoiceStatus } from "@prisma/client";

/**
 * Self-contained password hashing matching src/lib/auth/password.ts
 * Uses Node.js crypto scrypt with random salt.
 */
const KEY_LENGTH = 32;
const SCRYPT_N = 16384;

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .scryptSync(password, salt, KEY_LENGTH, { N: SCRYPT_N })
    .toString("hex");
  return `scrypt$${SCRYPT_N}$${salt}$${hash}`;
}

/**
 * Self-contained AuditAction matching src/lib/audit.ts
 */
const AuditAction = {
  USER_SIGNUP: "user.signup",
  USER_LOGIN: "user.login",
  USER_LOGIN_FAILED: "user.login_failed",
  USER_LOGOUT: "user.logout",
  USER_EMAIL_VERIFIED: "user.email_verified",
  USER_PASSWORD_RESET_REQUESTED: "user.password_reset_requested",
  USER_PASSWORD_RESET: "user.password_reset",
  USER_PASSWORD_CHANGED: "user.password_changed",
  USER_PROFILE_UPDATED: "user.profile_updated",
  USER_DELETED: "user.deleted",
  USER_STATUS_CHANGED: "user.status_changed",
  ORG_CREATED: "org.created",
  ORG_UPDATED: "org.updated",
  ORG_VERIFIED: "org.verification_changed",
  ORG_SUSPENDED: "org.suspension_changed",
  ORG_PLAN_CHANGED: "org.plan_changed",
  ORG_QUOTA_CHANGED: "org.quota_changed",
  MEMBER_INVITED: "member.invited",
  MEMBER_INVITE_REVOKED: "member.invite_revoked",
  MEMBER_JOINED: "member.joined",
  MEMBER_ROLE_CHANGED: "member.role_changed",
  MEMBER_REMOVED: "member.removed",
  JOB_CREATED: "job.created",
  JOB_UPDATED: "job.updated",
  JOB_STATUS_CHANGED: "job.status_changed",
  JOB_DELETED: "job.deleted",
  APPLICATION_STATUS_CHANGED: "application.status_changed",
  BILLING_CHECKOUT_CREATED: "billing.checkout_created",
  BILLING_PAYMENT_SUCCEEDED: "billing.payment_succeeded",
  BILLING_PAYMENT_FAILED: "billing.payment_failed",
} as const;

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting MatchLab multi-tenant database seed...");

  // ---------------------------------------------------------------------------
  // 1. Super Admin Account
  // ---------------------------------------------------------------------------
  const superAdminEmail = process.env.SEED_SUPER_ADMIN_EMAIL || "admin@matchlab.id";
  const superAdminPassword = process.env.SEED_SUPER_ADMIN_PASSWORD || "admin123";

  if (process.env.NODE_ENV === "production" && !process.env.SEED_SUPER_ADMIN_PASSWORD) {
    console.warn("⚠️ WARNING: Running seed in production without SEED_SUPER_ADMIN_PASSWORD set! Using default fallback password.");
  }

  const superAdmin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {
      name: "MatchLab Super Admin",
      systemRole: SystemRole.SUPER_ADMIN,
      isActive: true,
      emailVerifiedAt: new Date(),
      lastLoginAt: new Date(),
      passwordHash: hashPassword(superAdminPassword),
    },
    create: {
      email: superAdminEmail,
      name: "MatchLab Super Admin",
      passwordHash: hashPassword(superAdminPassword),
      systemRole: SystemRole.SUPER_ADMIN,
      isActive: true,
      emailVerifiedAt: new Date(),
      lastLoginAt: new Date(),
    },
  });
  console.log(`✅ Super Admin created/updated: ${superAdmin.email}`);

  const seedSampleData = process.env.SEED_SAMPLE_DATA !== "false";
  if (!seedSampleData) {
    console.log("ℹ️ SEED_SAMPLE_DATA=false: skipping sample organizations, jobs, candidate profiles, and invoices.");
    return;
  }

  // ---------------------------------------------------------------------------
  // 2. Organization 1: ASE Research Lab (SME_PRO)
  // ---------------------------------------------------------------------------
  const aseOrg = await prisma.organization.upsert({
    where: { slug: "aselab" },
    update: {
      name: "ASE Research Lab",
      planTier: PlanTier.SME_PRO,
      applicantQuota: 750,
      applicantsUsed: 4,
      billingEmail: "finance@aselab.id",
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isSuspended: false,
      cultureDescription:
        "Autonomous software engineering laboratory conducting cutting-edge distributed systems and AI systems research with high rigor and team accountability.",
      isVerified: true,
    },
    create: {
      name: "ASE Research Lab",
      slug: "aselab",
      planTier: PlanTier.SME_PRO,
      applicantQuota: 750,
      applicantsUsed: 4,
      billingEmail: "finance@aselab.id",
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isSuspended: false,
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
      emailVerifiedAt: new Date(),
      lastLoginAt: new Date(Date.now() - 3600000),
      passwordHash: hashPassword("aselab123"),
    },
    create: {
      name: "Dr. Hendra Wibowo",
      email: "hendra@aselab.id",
      passwordHash: hashPassword("aselab123"),
      systemRole: SystemRole.COMPANY_USER,
      isActive: true,
      emailVerifiedAt: new Date(),
      lastLoginAt: new Date(Date.now() - 3600000),
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
      emailVerifiedAt: new Date(),
      lastLoginAt: new Date(Date.now() - 7200000),
      passwordHash: hashPassword("aselab123"),
    },
    create: {
      name: "Budi Santoso",
      email: "budi@aselab.id",
      passwordHash: hashPassword("aselab123"),
      systemRole: SystemRole.COMPANY_USER,
      isActive: true,
      emailVerifiedAt: new Date(),
      lastLoginAt: new Date(Date.now() - 7200000),
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

  // ASE Job 1: Senior Systems & Cloud Infrastructure Engineer
  const aseJob1 = await prisma.jobRequisition.upsert({
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
  console.log(`✅ Job Requisition created/updated: ${aseJob1.title}`);

  // ASE Job 2: AI Systems & Distributed Computing Researcher
  const aseJob2 = await prisma.jobRequisition.upsert({
    where: { slug: "aselab-ai-researcher" },
    update: {
      title: "AI Systems & Distributed Computing Researcher",
      organizationId: aseOrg.id,
      rawUserPrompt: "Mencari asisten riset AI yang menguasai pipeline evaluasi LLM, fine-tuning PyTorch, dan eksperimen GPU cluster.",
      maxTurns: 8,
      isActive: true,
      generatedSpec: {
        roleSummary: "Mendesain benchmark komputasi model AI, pipeline sintesis dataset, dan arsitektur evaluasi otomatis.",
        domainWeight: 60,
        implicitWeight: 40,
        requiredSkills: ["PyTorch", "Python", "LLM Evaluation", "CUDA", "FastAPI"],
      },
      scoringRubric: {
        domainWeight: 60,
        implicitWeight: 40,
        domainTraits: [
          { name: "AI & Model Evaluation", description: "Keahlian metrik evaluasi model (MMLU, HumanEval) dan fine-tuning", weight: 35 },
          { name: "High-Throughput Pipelines", description: "Pengoptimalan throughput inferensi dan batch processing", weight: 25 },
        ],
        implicitTraits: [
          { name: "Research Rigor", description: "Ketelitian mencatat log eksperimen dan integritas data", weight: 20 },
          { name: "Academic Communication", description: "Kejelasan menyampaikan metodologi dan hipotesis penelitian", weight: 20 },
        ],
        probeScenarios: [
          "Bagaimana Anda mendeteksi data contamination saat mengevaluasi benchmark penalaran model bahasa?",
          "Bagaimana cara mengatasi CUDA Out of Memory saat training multi-GPU tanpa mengurangi batch size secara drastis?",
        ],
      },
    },
    create: {
      title: "AI Systems & Distributed Computing Researcher",
      slug: "aselab-ai-researcher",
      organizationId: aseOrg.id,
      rawUserPrompt: "Mencari asisten riset AI yang menguasai pipeline evaluasi LLM, fine-tuning PyTorch, dan eksperimen GPU cluster.",
      maxTurns: 8,
      isActive: true,
      generatedSpec: {
        roleSummary: "Mendesain benchmark komputasi model AI, pipeline sintesis dataset, dan arsitektur evaluasi otomatis.",
        domainWeight: 60,
        implicitWeight: 40,
        requiredSkills: ["PyTorch", "Python", "LLM Evaluation", "CUDA", "FastAPI"],
      },
      scoringRubric: {
        domainWeight: 60,
        implicitWeight: 40,
        domainTraits: [
          { name: "AI & Model Evaluation", description: "Keahlian metrik evaluasi model (MMLU, HumanEval) dan fine-tuning", weight: 35 },
          { name: "High-Throughput Pipelines", description: "Pengoptimalan throughput inferensi dan batch processing", weight: 25 },
        ],
        implicitTraits: [
          { name: "Research Rigor", description: "Ketelitian mencatat log eksperimen dan integritas data", weight: 20 },
          { name: "Academic Communication", description: "Kejelasan menyampaikan metodologi dan hipotesis penelitian", weight: 20 },
        ],
        probeScenarios: [
          "Bagaimana Anda mendeteksi data contamination saat mengevaluasi benchmark penalaran model bahasa?",
          "Bagaimana cara mengatasi CUDA Out of Memory saat training multi-GPU tanpa mengurangi batch size secara drastis?",
        ],
      },
    },
  });
  console.log(`✅ Job Requisition created/updated: ${aseJob2.title}`);

  // ---------------------------------------------------------------------------
  // 3. Organization 2: Nusantara Tech Startup (PAY_PER_OPREC)
  // ---------------------------------------------------------------------------
  const nusantaraOrg = await prisma.organization.upsert({
    where: { slug: "nusantara-tech" },
    update: {
      name: "Nusantara Tech Startup",
      planTier: PlanTier.PAY_PER_OPREC,
      applicantQuota: 150,
      applicantsUsed: 2,
      billingEmail: "billing@nusantaratech.id",
      isSuspended: false,
      cultureDescription:
        "High-growth Southeast Asian fintech startup championing customer obsession, fast execution, and modern cloud technologies.",
      isVerified: true,
    },
    create: {
      name: "Nusantara Tech Startup",
      slug: "nusantara-tech",
      planTier: PlanTier.PAY_PER_OPREC,
      applicantQuota: 150,
      applicantsUsed: 2,
      billingEmail: "billing@nusantaratech.id",
      isSuspended: false,
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
      emailVerifiedAt: new Date(),
      lastLoginAt: new Date(Date.now() - 5400000),
      passwordHash: hashPassword("nusantara123"),
    },
    create: {
      name: "Siti Rahma",
      email: "siti@nusantaratech.id",
      passwordHash: hashPassword("nusantara123"),
      systemRole: SystemRole.COMPANY_USER,
      isActive: true,
      emailVerifiedAt: new Date(),
      lastLoginAt: new Date(Date.now() - 5400000),
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

  // Nusantara Job 1: Fullstack Product Engineer
  const nusantaraJob1 = await prisma.jobRequisition.upsert({
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
  console.log(`✅ Job Requisition created/updated: ${nusantaraJob1.title}`);

  // Nusantara Job 2: Backend Distributed Systems Engineer (Go)
  const nusantaraJob2 = await prisma.jobRequisition.upsert({
    where: { slug: "nusantara-backend-go" },
    update: {
      title: "Backend Distributed Systems Engineer (Go)",
      organizationId: nusantaraOrg.id,
      rawUserPrompt: "Mencari backend engineer Go berpengalaman dengan message queue Kafka, Redis caching, dan distributed database PostgreSQL untuk transaksi fintech berkecepatan tinggi.",
      maxTurns: 8,
      isActive: true,
      generatedSpec: {
        roleSummary: "Membangun sistem pembayaran real-time dengan skalabilitas jutaan transaksi per hari.",
        domainWeight: 55,
        implicitWeight: 45,
        requiredSkills: ["Go", "Kafka", "PostgreSQL", "Redis", "Distributed Transactions"],
      },
      scoringRubric: {
        domainWeight: 55,
        implicitWeight: 45,
        domainTraits: [
          { name: "Concurrency & High Throughput", description: "Penguasaan Go goroutines, channels, dan lock contention", weight: 30 },
          { name: "Transactional Integrity", description: "Paham 2-phase commit, idempotency, dan distributed locks", weight: 25 },
        ],
        implicitTraits: [
          { name: "Engineering Rigor", description: "Testing intensif, error tracing, dan observability", weight: 25 },
          { name: "Calm Under Outage", description: "Mitigasi kegagalan transaksi secara cepat dan teratur", weight: 20 },
        ],
        probeScenarios: [
          "Bagaimana Anda menjamin transaksi tidak terduplikasi saat terjadi timeout network pada webhook penyedia pembayaran?",
          "Ceritakan pengalaman Anda mengoptimalkan query Postgres yang mengalami deadlocks pada traffic puncak.",
        ],
      },
    },
    create: {
      title: "Backend Distributed Systems Engineer (Go)",
      slug: "nusantara-backend-go",
      organizationId: nusantaraOrg.id,
      rawUserPrompt: "Mencari backend engineer Go berpengalaman dengan message queue Kafka, Redis caching, dan distributed database PostgreSQL untuk transaksi fintech berkecepatan tinggi.",
      maxTurns: 8,
      isActive: true,
      generatedSpec: {
        roleSummary: "Membangun sistem pembayaran real-time dengan skalabilitas jutaan transaksi per hari.",
        domainWeight: 55,
        implicitWeight: 45,
        requiredSkills: ["Go", "Kafka", "PostgreSQL", "Redis", "Distributed Transactions"],
      },
      scoringRubric: {
        domainWeight: 55,
        implicitWeight: 45,
        domainTraits: [
          { name: "Concurrency & High Throughput", description: "Penguasaan Go goroutines, channels, dan lock contention", weight: 30 },
          { name: "Transactional Integrity", description: "Paham 2-phase commit, idempotency, dan distributed locks", weight: 25 },
        ],
        implicitTraits: [
          { name: "Engineering Rigor", description: "Testing intensif, error tracing, dan observability", weight: 25 },
          { name: "Calm Under Outage", description: "Mitigasi kegagalan transaksi secara cepat dan teratur", weight: 20 },
        ],
        probeScenarios: [
          "Bagaimana Anda menjamin transaksi tidak terduplikasi saat terjadi timeout network pada webhook penyedia pembayaran?",
          "Ceritakan pengalaman Anda mengoptimalkan query Postgres yang mengalami deadlocks pada traffic puncak.",
        ],
      },
    },
  });
  console.log(`✅ Job Requisition created/updated: ${nusantaraJob2.title}`);

  // ---------------------------------------------------------------------------
  // 4. Organization 3: PT Kreasi Digital Muda (FREE Tier)
  // ---------------------------------------------------------------------------
  const kreasiOrg = await prisma.organization.upsert({
    where: { slug: "kreasimuda" },
    update: {
      name: "PT Kreasi Digital Muda",
      planTier: PlanTier.FREE,
      applicantQuota: 20,
      applicantsUsed: 0,
      billingEmail: "halo@kreasimuda.co.id",
      isSuspended: false,
      cultureDescription:
        "Studio pengembangan web dan mobile kreatif yang fokus pada solusi UMKM digital di Indonesia.",
      isVerified: false,
    },
    create: {
      name: "PT Kreasi Digital Muda",
      slug: "kreasimuda",
      planTier: PlanTier.FREE,
      applicantQuota: 20,
      applicantsUsed: 0,
      billingEmail: "halo@kreasimuda.co.id",
      isSuspended: false,
      cultureDescription:
        "Studio pengembangan web dan mobile kreatif yang fokus pada solusi UMKM digital di Indonesia.",
      isVerified: false,
    },
  });
  console.log(`✅ Organization created/updated: ${kreasiOrg.name} (${kreasiOrg.slug})`);

  const kreasiAdminUser = await prisma.user.upsert({
    where: { email: "maya@kreasimuda.co.id" },
    update: {
      name: "Maya Indah",
      systemRole: SystemRole.COMPANY_USER,
      isActive: true,
      emailVerifiedAt: new Date(),
      lastLoginAt: new Date(Date.now() - 7200000),
      passwordHash: hashPassword("kreasi123"),
    },
    create: {
      name: "Maya Indah",
      email: "maya@kreasimuda.co.id",
      passwordHash: hashPassword("kreasi123"),
      systemRole: SystemRole.COMPANY_USER,
      isActive: true,
      emailVerifiedAt: new Date(),
      lastLoginAt: new Date(Date.now() - 7200000),
    },
  });

  await prisma.organizationMember.upsert({
    where: {
      userId_organizationId: {
        userId: kreasiAdminUser.id,
        organizationId: kreasiOrg.id,
      },
    },
    update: { orgRole: OrgRole.ORG_ADMIN },
    create: {
      userId: kreasiAdminUser.id,
      organizationId: kreasiOrg.id,
      orgRole: OrgRole.ORG_ADMIN,
    },
  });

  const kreasiJob1 = await prisma.jobRequisition.upsert({
    where: { slug: "kreasi-junior-frontend" },
    update: {
      title: "Junior Frontend Web Developer",
      organizationId: kreasiOrg.id,
      rawUserPrompt: "Mencari developer frontend pemula yang menguasai HTML, CSS, JavaScript, dan React dasar.",
      maxTurns: 6,
      isActive: true,
      generatedSpec: {
        roleSummary: "Membangun antarmuka landing page dan website profil interaktif untuk klien UMKM.",
        domainWeight: 60,
        implicitWeight: 40,
        requiredSkills: ["HTML5", "CSS3", "JavaScript", "React"],
      },
      scoringRubric: {
        domainWeight: 60,
        implicitWeight: 40,
        domainTraits: [
          { name: "Frontend Basics", description: "Kemampuan styling responsif dan manipulasi DOM", weight: 35 },
          { name: "React Fundamentals", description: "Pemahaman props, state, dan lifecycle dasar", weight: 25 },
        ],
        implicitTraits: [
          { name: "Willingness to Learn", description: "Antusiasme mempelajari teknologi baru dan menerima masukan", weight: 25 },
          { name: "Team Communication", description: "Keaktifan bertanya dan berdiskusi", weight: 15 },
        ],
        probeScenarios: [
          "Ceritakan project pertama yang Anda buat menggunakan React dan tantangannya.",
          "Bagaimana cara Anda memastikan website tampil rapi di layar ponsel maupun desktop?",
        ],
      },
    },
    create: {
      title: "Junior Frontend Web Developer",
      slug: "kreasi-junior-frontend",
      organizationId: kreasiOrg.id,
      rawUserPrompt: "Mencari developer frontend pemula yang menguasai HTML, CSS, JavaScript, dan React dasar.",
      maxTurns: 6,
      isActive: true,
      generatedSpec: {
        roleSummary: "Membangun antarmuka landing page dan website profil interaktif untuk klien UMKM.",
        domainWeight: 60,
        implicitWeight: 40,
        requiredSkills: ["HTML5", "CSS3", "JavaScript", "React"],
      },
      scoringRubric: {
        domainWeight: 60,
        implicitWeight: 40,
        domainTraits: [
          { name: "Frontend Basics", description: "Kemampuan styling responsif dan manipulasi DOM", weight: 35 },
          { name: "React Fundamentals", description: "Pemahaman props, state, dan lifecycle dasar", weight: 25 },
        ],
        implicitTraits: [
          { name: "Willingness to Learn", description: "Antusiasme mempelajari teknologi baru dan menerima masukan", weight: 25 },
          { name: "Team Communication", description: "Keaktifan bertanya dan berdiskusi", weight: 15 },
        ],
        probeScenarios: [
          "Ceritakan project pertama yang Anda buat menggunakan React dan tantangannya.",
          "Bagaimana cara Anda memastikan website tampil rapi di layar ponsel maupun desktop?",
        ],
      },
    },
  });
  console.log(`✅ Job Requisition created/updated: ${kreasiJob1.title}`);

  // ---------------------------------------------------------------------------
  // 5. Job Seeker 1: Dewi Lestari (Senior Fullstack & Cloud)
  // ---------------------------------------------------------------------------
  const dewiUser = await prisma.user.upsert({
    where: { email: "dewi@example.com" },
    update: {
      name: "Dewi Lestari",
      systemRole: SystemRole.JOB_SEEKER,
      isActive: true,
      emailVerifiedAt: new Date(),
      lastLoginAt: new Date(Date.now() - 3600000),
      passwordHash: hashPassword("dewi123"),
    },
    create: {
      name: "Dewi Lestari",
      email: "dewi@example.com",
      passwordHash: hashPassword("dewi123"),
      systemRole: SystemRole.JOB_SEEKER,
      isActive: true,
      emailVerifiedAt: new Date(),
      lastLoginAt: new Date(Date.now() - 3600000),
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
  console.log(`✅ Job Seeker 1 Profile: ${dewiUser.name}`);

  // Dewi -> ASE Lab (Senior Systems): EVALUATED
  const dewiAppAse = await prisma.jobApplication.upsert({
    where: {
      jobId_candidateProfileId: {
        jobId: aseJob1.id,
        candidateProfileId: dewiProfile.id,
      },
    },
    update: { status: ApplicationStatus.EVALUATED },
    create: {
      jobId: aseJob1.id,
      candidateProfileId: dewiProfile.id,
      status: ApplicationStatus.EVALUATED,
    },
  });

  await prisma.interviewSession.upsert({
    where: { applicationId: dewiAppAse.id },
    update: {
      turnCount: 8,
      totalTokensUsed: 5820,
      completedAt: new Date(),
    },
    create: {
      applicationId: dewiAppAse.id,
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
        {
          id: "m3",
          role: "assistant",
          content: "Bagus sekali. Misalkan satu container mengalami OOM-kill berulang kali dan mengganggu service lain di host yang sama. Bagaimana langkah investigasi dan isolasi Anda?",
          timestamp: new Date(Date.now() - 3300000).toISOString(),
        },
        {
          id: "m4",
          role: "user",
          content: "Pertama saya cek log kernel dmesg -T untuk konfirmasi OOM killer. Kedua, pasang limit eksplisit memory dan swap di docker compose. Ketiga, ambil heap snapshot service untuk profiling alokasi memori objek.",
          timestamp: new Date(Date.now() - 3200000).toISOString(),
        },
      ],
    },
  });

  await prisma.evaluation.upsert({
    where: { applicationId: dewiAppAse.id },
    update: {
      matchScore: 91,
      domainScore: 94,
      implicitBehaviorScore: 88,
      evalTokensUsed: 1240,
      executiveSummary:
        "Kandidat menunjukkan penguasaan kuat terhadap containerization dan Linux internals. Komunikasi tenang, metodis, dan terstruktur dalam skenario incident response.",
      greenFlags: ["Pengalaman praktis Linux & Docker kuat", "Rendah hati dan fokus pada akar masalah", "Prosedur insiden sistematis"],
      redFlags: [],
      finalInterviewProbes: ["Gali arsitektur cluster Kubernetes dan pipeline CI/CD yang pernah dikelola"],
      traitBreakdown: [
        { traitName: "Containerization & Linux", score: 95, reasoning: "Menjelaskan mekanisme isolasi container dan debugging cgroups dengan presisi." },
        { traitName: "Stress Tolerance & On-Call", score: 88, reasoning: "Memiliki prosedur yang jelas saat penanganan insiden darurat." },
      ],
    },
    create: {
      applicationId: dewiAppAse.id,
      matchScore: 91,
      domainScore: 94,
      implicitBehaviorScore: 88,
      evalTokensUsed: 1240,
      executiveSummary:
        "Kandidat menunjukkan penguasaan kuat terhadap containerization dan Linux internals. Komunikasi tenang, metodis, dan terstruktur dalam skenario incident response.",
      greenFlags: ["Pengalaman praktis Linux & Docker kuat", "Rendah hati dan fokus pada akar masalah", "Prosedur insiden sistematis"],
      redFlags: [],
      finalInterviewProbes: ["Gali arsitektur cluster Kubernetes dan pipeline CI/CD yang pernah dikelola"],
      traitBreakdown: [
        { traitName: "Containerization & Linux", score: 95, reasoning: "Menjelaskan mekanisme isolasi container dan debugging cgroups dengan presisi." },
        { traitName: "Stress Tolerance & On-Call", score: 88, reasoning: "Memiliki prosedur yang jelas saat penanganan insiden darurat." },
      ],
    },
  });

  // Dewi -> Nusantara Tech (Fullstack): SHORTLISTED
  const dewiAppNusantara = await prisma.jobApplication.upsert({
    where: {
      jobId_candidateProfileId: {
        jobId: nusantaraJob1.id,
        candidateProfileId: dewiProfile.id,
      },
    },
    update: { status: ApplicationStatus.SHORTLISTED },
    create: {
      jobId: nusantaraJob1.id,
      candidateProfileId: dewiProfile.id,
      status: ApplicationStatus.SHORTLISTED,
    },
  });

  await prisma.interviewSession.upsert({
    where: { applicationId: dewiAppNusantara.id },
    update: {
      turnCount: 8,
      totalTokensUsed: 5200,
      completedAt: new Date(),
    },
    create: {
      applicationId: dewiAppNusantara.id,
      turnCount: 8,
      totalTokensUsed: 5200,
      startedAt: new Date(Date.now() - 7200000),
      completedAt: new Date(Date.now() - 3600000),
      messages: [
        {
          id: "dn1",
          role: "assistant",
          content: "Halo Dewi! Ceritakan bagaimana Anda mengoptimalkan Core Web Vitals dan SSR hydration di Next.js App Router.",
          timestamp: new Date(Date.now() - 7100000).toISOString(),
        },
        {
          id: "dn2",
          role: "user",
          content: "Saya membagi komponen Server dan Client secara ketat, memanfaatkan Suspense boundaries untuk streaming, dan mengisolasi dynamic imports untuk bundle berat seperti charts.",
          timestamp: new Date(Date.now() - 7000000).toISOString(),
        },
      ],
    },
  });

  await prisma.evaluation.upsert({
    where: { applicationId: dewiAppNusantara.id },
    update: {
      matchScore: 94,
      domainScore: 96,
      implicitBehaviorScore: 92,
      evalTokensUsed: 1350,
      executiveSummary:
        "Kandidat ideal untuk posisi Fullstack Product Engineer. Memahami nuansa performa frontend modern serta arsitektur backend Next.js dengan matang.",
      greenFlags: ["Penguasaan Next.js Server Components tinggi", "User-first thinking pada form checkout"],
      redFlags: [],
      finalInterviewProbes: ["Tanyakan preferensi state management untuk aplikasi fintech skala besar"],
      traitBreakdown: [
        { traitName: "Frontend Mastery", score: 96, reasoning: "Sangat fasih memisahkan server vs client components dan streaming SSR." },
        { traitName: "Velocity & Agility", score: 92, reasoning: "Mampu menjelaskan release cycle cepat dan strategi rollback." },
      ],
    },
    create: {
      applicationId: dewiAppNusantara.id,
      matchScore: 94,
      domainScore: 96,
      implicitBehaviorScore: 92,
      evalTokensUsed: 1350,
      executiveSummary:
        "Kandidat ideal untuk posisi Fullstack Product Engineer. Memahami nuansa performa frontend modern serta arsitektur backend Next.js dengan matang.",
      greenFlags: ["Penguasaan Next.js Server Components tinggi", "User-first thinking pada form checkout"],
      redFlags: [],
      finalInterviewProbes: ["Tanyakan preferensi state management untuk aplikasi fintech skala besar"],
      traitBreakdown: [
        { traitName: "Frontend Mastery", score: 96, reasoning: "Sangat fasih memisahkan server vs client components dan streaming SSR." },
        { traitName: "Velocity & Agility", score: 92, reasoning: "Mampu menjelaskan release cycle cepat dan strategi rollback." },
      ],
    },
  });

  // ---------------------------------------------------------------------------
  // 5. Job Seeker 2: Fajar Pratama (Junior AI/Backend)
  // ---------------------------------------------------------------------------
  const fajarUser = await prisma.user.upsert({
    where: { email: "fajar@example.com" },
    update: {
      name: "Fajar Pratama",
      systemRole: SystemRole.JOB_SEEKER,
      isActive: true,
      emailVerifiedAt: new Date(),
      lastLoginAt: new Date(Date.now() - 3600000),
      passwordHash: hashPassword("fajar123"),
    },
    create: {
      name: "Fajar Pratama",
      email: "fajar@example.com",
      passwordHash: hashPassword("fajar123"),
      systemRole: SystemRole.JOB_SEEKER,
      isActive: true,
      emailVerifiedAt: new Date(),
      lastLoginAt: new Date(Date.now() - 3600000),
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
  console.log(`✅ Job Seeker 2 Profile: ${fajarUser.name}`);

  // Fajar -> Nusantara Tech (Fullstack): IN_PROGRESS (turn 4/8)
  const fajarAppNusantara = await prisma.jobApplication.upsert({
    where: {
      jobId_candidateProfileId: {
        jobId: nusantaraJob1.id,
        candidateProfileId: fajarProfile.id,
      },
    },
    update: { status: ApplicationStatus.IN_PROGRESS },
    create: {
      jobId: nusantaraJob1.id,
      candidateProfileId: fajarProfile.id,
      status: ApplicationStatus.IN_PROGRESS,
    },
  });

  await prisma.interviewSession.upsert({
    where: { applicationId: fajarAppNusantara.id },
    update: {
      turnCount: 4,
      totalTokensUsed: 2950,
      completedAt: null,
    },
    create: {
      applicationId: fajarAppNusantara.id,
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
        {
          id: "mf3",
          role: "assistant",
          content: "Bagaimana Anda menangani race conditions saat dua user melakukan klaim kupon diskon terbatas secara bersamaan?",
          timestamp: new Date(Date.now() - 1500000).toISOString(),
        },
        {
          id: "mf4",
          role: "user",
          content: "Bisa menggunakan transaksi database dengan SELECT ... FOR UPDATE atau atomic decrement di Redis sebelum commit ke DB.",
          timestamp: new Date(Date.now() - 1400000).toISOString(),
        },
      ],
    },
  });

  // Fajar -> ASE Lab (AI Researcher): IN_PROGRESS (turn 6/8)
  const fajarAppAse = await prisma.jobApplication.upsert({
    where: {
      jobId_candidateProfileId: {
        jobId: aseJob2.id,
        candidateProfileId: fajarProfile.id,
      },
    },
    update: { status: ApplicationStatus.IN_PROGRESS },
    create: {
      jobId: aseJob2.id,
      candidateProfileId: fajarProfile.id,
      status: ApplicationStatus.IN_PROGRESS,
    },
  });

  await prisma.interviewSession.upsert({
    where: { applicationId: fajarAppAse.id },
    update: {
      turnCount: 6,
      totalTokensUsed: 4100,
      completedAt: null,
    },
    create: {
      applicationId: fajarAppAse.id,
      turnCount: 6,
      totalTokensUsed: 4100,
      startedAt: new Date(Date.now() - 2500000),
      messages: [
        {
          id: "fa1",
          role: "assistant",
          content: "Halo Fajar! Bisa ceritakan pipeline evaluasi LLM yang pernah Anda bangun atau gunakan dalam riset?",
          timestamp: new Date(Date.now() - 2400000).toISOString(),
        },
        {
          id: "fa2",
          role: "user",
          content: "Saya pernah membuat pipeline benchmark menggunakan lm-evaluation-harness dengan prompt templating custom untuk model bahasa Indonesia di HuggingFace.",
          timestamp: new Date(Date.now() - 2300000).toISOString(),
        },
      ],
    },
  });

  // ---------------------------------------------------------------------------
  // 6. Job Seeker 3: Bagas Pratama (Staff Infrastructure & SRE Specialist)
  // ---------------------------------------------------------------------------
  const bagasUser = await prisma.user.upsert({
    where: { email: "bagas@example.com" },
    update: {
      name: "Bagas Pratama",
      systemRole: SystemRole.JOB_SEEKER,
      isActive: true,
      emailVerifiedAt: new Date(),
      lastLoginAt: new Date(Date.now() - 3600000),
      passwordHash: hashPassword("bagas123"),
    },
    create: {
      name: "Bagas Pratama",
      email: "bagas@example.com",
      passwordHash: hashPassword("bagas123"),
      systemRole: SystemRole.JOB_SEEKER,
      isActive: true,
      emailVerifiedAt: new Date(),
      lastLoginAt: new Date(Date.now() - 3600000),
    },
  });

  const bagasProfile = await prisma.candidateProfile.upsert({
    where: { userId: bagasUser.id },
    update: {
      cvSummaryText:
        "Staff Infrastructure Engineer with 6+ years specializing in Linux kernel tuning, high-performance distributed KV stores, eBPF telemetry, and zero-downtime database migrations.",
      portfolioUrl: "https://github.com/bagaspratama-infra",
      skills: ["Linux Kernel", "Go", "Docker", "Kubernetes", "PostgreSQL", "eBPF", "Kafka"],
      isOpenToPool: true,
    },
    create: {
      userId: bagasUser.id,
      cvSummaryText:
        "Staff Infrastructure Engineer with 6+ years specializing in Linux kernel tuning, high-performance distributed KV stores, eBPF telemetry, and zero-downtime database migrations.",
      portfolioUrl: "https://github.com/bagaspratama-infra",
      skills: ["Linux Kernel", "Go", "Docker", "Kubernetes", "PostgreSQL", "eBPF", "Kafka"],
      isOpenToPool: true,
    },
  });
  console.log(`✅ Job Seeker 3 Profile: ${bagasUser.name}`);

  // Bagas -> ASE Lab (Senior Systems): SHORTLISTED (Score: 96)
  const bagasAppAse = await prisma.jobApplication.upsert({
    where: {
      jobId_candidateProfileId: {
        jobId: aseJob1.id,
        candidateProfileId: bagasProfile.id,
      },
    },
    update: { status: ApplicationStatus.SHORTLISTED },
    create: {
      jobId: aseJob1.id,
      candidateProfileId: bagasProfile.id,
      status: ApplicationStatus.SHORTLISTED,
    },
  });

  await prisma.interviewSession.upsert({
    where: { applicationId: bagasAppAse.id },
    update: {
      turnCount: 8,
      totalTokensUsed: 6240,
      completedAt: new Date(),
    },
    create: {
      applicationId: bagasAppAse.id,
      turnCount: 8,
      totalTokensUsed: 6240,
      startedAt: new Date(Date.now() - 5400000),
      completedAt: new Date(Date.now() - 1800000),
      messages: [
        {
          id: "ba1",
          role: "assistant",
          content: "Selamat datang Bagas. Bagaimana Anda mendiagnosis network latency spike antar-node di distributed cluster?",
          timestamp: new Date(Date.now() - 5300000).toISOString(),
        },
        {
          id: "ba2",
          role: "user",
          content: "Saya menggunakan eBPF tool seperti tcptop dan bcc tools untuk mengamati socket buffer queues dan TCP retransmissions pada kernel level sebelum memeriksa layer aplikasi.",
          timestamp: new Date(Date.now() - 5200000).toISOString(),
        },
      ],
    },
  });

  await prisma.evaluation.upsert({
    where: { applicationId: bagasAppAse.id },
    update: {
      matchScore: 96,
      domainScore: 98,
      implicitBehaviorScore: 94,
      evalTokensUsed: 1420,
      executiveSummary:
        "Kandidat kaliber Staff/Lead dengan penguasaan mendalam arsitektur kernel Linux dan sistem terdistribusi. Menunjukkan pola komunikasi berbasis data dan ketenangan tingkat tinggi saat insiden.",
      greenFlags: ["Pemahaman mendalam eBPF dan networking stack Linux", "Root-cause analysis berorientasi sistem", "Kepemimpinan on-call teruji"],
      redFlags: [],
      finalInterviewProbes: ["Diskusikan ekspektasi kompensasi dan kesiapan memandu riset asisten lab mahasiswa"],
      traitBreakdown: [
        { traitName: "Containerization & Linux", score: 99, reasoning: "Menjelaskan mekanisme cgroups v2, namespace isolation, dan kernel parameters secara sempurna." },
        { traitName: "Stress Tolerance & On-Call", score: 94, reasoning: "Memiliki playbook penanganan krisis infrastruktur yang sangat teruji." },
      ],
    },
    create: {
      applicationId: bagasAppAse.id,
      matchScore: 96,
      domainScore: 98,
      implicitBehaviorScore: 94,
      evalTokensUsed: 1420,
      executiveSummary:
        "Kandidat kaliber Staff/Lead dengan penguasaan mendalam arsitektur kernel Linux dan sistem terdistribusi. Menunjukkan pola komunikasi berbasis data dan ketenangan tingkat tinggi saat insiden.",
      greenFlags: ["Pemahaman mendalam eBPF dan networking stack Linux", "Root-cause analysis berorientasi sistem", "Kepemimpinan on-call teruji"],
      redFlags: [],
      finalInterviewProbes: ["Diskusikan ekspektasi kompensasi dan kesiapan memandu riset asisten lab mahasiswa"],
      traitBreakdown: [
        { traitName: "Containerization & Linux", score: 99, reasoning: "Menjelaskan mekanisme cgroups v2, namespace isolation, dan kernel parameters secara sempurna." },
        { traitName: "Stress Tolerance & On-Call", score: 94, reasoning: "Memiliki playbook penanganan krisis infrastruktur yang sangat teruji." },
      ],
    },
  });

  // Bagas -> Nusantara Tech (Backend Go): SHORTLISTED (Score: 95)
  const bagasAppNusantaraGo = await prisma.jobApplication.upsert({
    where: {
      jobId_candidateProfileId: {
        jobId: nusantaraJob2.id,
        candidateProfileId: bagasProfile.id,
      },
    },
    update: { status: ApplicationStatus.SHORTLISTED },
    create: {
      jobId: nusantaraJob2.id,
      candidateProfileId: bagasProfile.id,
      status: ApplicationStatus.SHORTLISTED,
    },
  });

  await prisma.interviewSession.upsert({
    where: { applicationId: bagasAppNusantaraGo.id },
    update: {
      turnCount: 8,
      totalTokensUsed: 5900,
      completedAt: new Date(),
    },
    create: {
      applicationId: bagasAppNusantaraGo.id,
      turnCount: 8,
      totalTokensUsed: 5900,
      startedAt: new Date(Date.now() - 4000000),
      completedAt: new Date(Date.now() - 1000000),
      messages: [
        {
          id: "bng1",
          role: "assistant",
          content: "Halo Bagas! Dalam arsitektur microservices pembayaran, bagaimana Anda mengimplementasikan pola Saga atau 2-phase commit untuk menjaga konsistensi?",
          timestamp: new Date(Date.now() - 3900000).toISOString(),
        },
        {
          id: "bng2",
          role: "user",
          content: "Saya lebih memilih Orchestration-based Saga dengan outbox pattern di PostgreSQL dan Kafka untuk event publishing, menjamin at-least-once delivery dengan idempotency key di setiap consumer.",
          timestamp: new Date(Date.now() - 3800000).toISOString(),
        },
      ],
    },
  });

  await prisma.evaluation.upsert({
    where: { applicationId: bagasAppNusantaraGo.id },
    update: {
      matchScore: 95,
      domainScore: 97,
      implicitBehaviorScore: 93,
      evalTokensUsed: 1380,
      executiveSummary:
        "Sangat menguasai pola sistem terdistribusi perbankan dan transaksi e-commerce. Desain idempotency dan penanganan timeout transaksional sangat matang.",
      greenFlags: ["Pemahaman transactional outbox pattern sempurna", "Pengalaman optimasi throughput Kafka"],
      redFlags: [],
      finalInterviewProbes: ["Tanyakan preferensi observabilitas open-telemetry vs custom metrics collector"],
      traitBreakdown: [
        { traitName: "Concurrency & High Throughput", score: 98, reasoning: "Paham betul alokasi memori runtime Go dan pencegahan goroutine leaks." },
        { traitName: "Transactional Integrity", score: 96, reasoning: "Pola Saga orchestration dengan outbox pattern sangat tepat sasaran." },
      ],
    },
    create: {
      applicationId: bagasAppNusantaraGo.id,
      matchScore: 95,
      domainScore: 97,
      implicitBehaviorScore: 93,
      evalTokensUsed: 1380,
      executiveSummary:
        "Sangat menguasai pola sistem terdistribusi perbankan dan transaksi e-commerce. Desain idempotency dan penanganan timeout transaksional sangat matang.",
      greenFlags: ["Pemahaman transactional outbox pattern sempurna", "Pengalaman optimasi throughput Kafka"],
      redFlags: [],
      finalInterviewProbes: ["Tanyakan preferensi observabilitas open-telemetry vs custom metrics collector"],
      traitBreakdown: [
        { traitName: "Concurrency & High Throughput", score: 98, reasoning: "Paham betul alokasi memori runtime Go dan pencegahan goroutine leaks." },
        { traitName: "Transactional Integrity", score: 96, reasoning: "Pola Saga orchestration dengan outbox pattern sangat tepat sasaran." },
      ],
    },
  });

  // ---------------------------------------------------------------------------
  // 7. Job Seeker 4: Aisyah Putri (Modern Frontend & UX Engineer)
  // ---------------------------------------------------------------------------
  const aisyahUser = await prisma.user.upsert({
    where: { email: "aisyah@example.com" },
    update: {
      name: "Aisyah Putri",
      systemRole: SystemRole.JOB_SEEKER,
      isActive: true,
      emailVerifiedAt: new Date(),
      lastLoginAt: new Date(Date.now() - 3600000),
      passwordHash: hashPassword("aisyah123"),
    },
    create: {
      name: "Aisyah Putri",
      email: "aisyah@example.com",
      passwordHash: hashPassword("aisyah123"),
      systemRole: SystemRole.JOB_SEEKER,
      isActive: true,
      emailVerifiedAt: new Date(),
      lastLoginAt: new Date(Date.now() - 3600000),
    },
  });

  const aisyahProfile = await prisma.candidateProfile.upsert({
    where: { userId: aisyahUser.id },
    update: {
      cvSummaryText:
        "Frontend Engineer specialized in React 19, Next.js, Web Performance, Design Systems, and Accessible User Interfaces (WCAG 2.1 AA).",
      portfolioUrl: "https://aisyah.design/dev",
      skills: ["React 19", "Next.js", "Tailwind CSS", "TypeScript", "UI/UX", "Web Performance"],
      isOpenToPool: true,
    },
    create: {
      userId: aisyahUser.id,
      cvSummaryText:
        "Frontend Engineer specialized in React 19, Next.js, Web Performance, Design Systems, and Accessible User Interfaces (WCAG 2.1 AA).",
      portfolioUrl: "https://aisyah.design/dev",
      skills: ["React 19", "Next.js", "Tailwind CSS", "TypeScript", "UI/UX", "Web Performance"],
      isOpenToPool: true,
    },
  });
  console.log(`✅ Job Seeker 4 Profile: ${aisyahUser.name}`);

  // Aisyah -> Nusantara Tech (Fullstack): EVALUATED (Score: 89)
  const aisyahAppNusantara = await prisma.jobApplication.upsert({
    where: {
      jobId_candidateProfileId: {
        jobId: nusantaraJob1.id,
        candidateProfileId: aisyahProfile.id,
      },
    },
    update: { status: ApplicationStatus.EVALUATED },
    create: {
      jobId: nusantaraJob1.id,
      candidateProfileId: aisyahProfile.id,
      status: ApplicationStatus.EVALUATED,
    },
  });

  await prisma.interviewSession.upsert({
    where: { applicationId: aisyahAppNusantara.id },
    update: {
      turnCount: 8,
      totalTokensUsed: 5410,
      completedAt: new Date(),
    },
    create: {
      applicationId: aisyahAppNusantara.id,
      turnCount: 8,
      totalTokensUsed: 5410,
      startedAt: new Date(Date.now() - 4800000),
      completedAt: new Date(Date.now() - 2000000),
      messages: [
        {
          id: "ap1",
          role: "assistant",
          content: "Halo Aisyah! Bagaimana Anda menyeimbangkan fluid micro-interactions dengan performa render 60fps di mobile browser?",
          timestamp: new Date(Date.now() - 4700000).toISOString(),
        },
        {
          id: "ap2",
          role: "user",
          content: "Saya prioritaskan CSS transforms dan opacity yang terakselerasi GPU (will-change), menghindari layout thrashing, dan mengaudit frame rate menggunakan Chrome DevTools Performance panel.",
          timestamp: new Date(Date.now() - 4600000).toISOString(),
        },
      ],
    },
  });

  await prisma.evaluation.upsert({
    where: { applicationId: aisyahAppNusantara.id },
    update: {
      matchScore: 89,
      domainScore: 92,
      implicitBehaviorScore: 86,
      evalTokensUsed: 1290,
      executiveSummary:
        "Kandidat kuat dengan kepekaan desain antarmuka dan web accessibility yang sangat tinggi. Sangat tepat untuk pengembangan produk B2C yang sensitif terhadap kepuasan pengguna.",
      greenFlags: ["Perhatian luar biasa pada user empathy dan aksesibilitas", "Pemahaman optimasi render pipeline browser"],
      redFlags: [],
      finalInterviewProbes: ["Gali pemahaman arsitektur database relasional dan optimasi query PostgreSQL"],
      traitBreakdown: [
        { traitName: "Frontend Mastery", score: 95, reasoning: "Sangat menguasai CSS rendering tree dan rendering lifecycle Next.js." },
        { traitName: "User Empathy", score: 92, reasoning: "Menyertakan pertimbangan pengguna berkebutuhan khusus dan slow-network fallbacks." },
      ],
    },
    create: {
      applicationId: aisyahAppNusantara.id,
      matchScore: 89,
      domainScore: 92,
      implicitBehaviorScore: 86,
      evalTokensUsed: 1290,
      executiveSummary:
        "Kandidat kuat dengan kepekaan desain antarmuka dan web accessibility yang sangat tinggi. Sangat tepat untuk pengembangan produk B2C yang sensitif terhadap kepuasan pengguna.",
      greenFlags: ["Perhatian luar biasa pada user empathy dan aksesibilitas", "Pemahaman optimasi render pipeline browser"],
      redFlags: [],
      finalInterviewProbes: ["Gali pemahaman arsitektur database relasional dan optimasi query PostgreSQL"],
      traitBreakdown: [
        { traitName: "Frontend Mastery", score: 95, reasoning: "Sangat menguasai CSS rendering tree dan rendering lifecycle Next.js." },
        { traitName: "User Empathy", score: 92, reasoning: "Menyertakan pertimbangan pengguna berkebutuhan khusus dan slow-network fallbacks." },
      ],
    },
  });

  // ---------------------------------------------------------------------------
  // 8. Job Seeker 5: Rizky Ramadhan (Entry-level / Needs Improvement)
  // ---------------------------------------------------------------------------
  const rizkyUser = await prisma.user.upsert({
    where: { email: "rizky@example.com" },
    update: {
      name: "Rizky Ramadhan",
      systemRole: SystemRole.JOB_SEEKER,
      isActive: true,
      emailVerifiedAt: new Date(),
      lastLoginAt: new Date(Date.now() - 3600000),
      passwordHash: hashPassword("rizky123"),
    },
    create: {
      name: "Rizky Ramadhan",
      email: "rizky@example.com",
      passwordHash: hashPassword("rizky123"),
      systemRole: SystemRole.JOB_SEEKER,
      isActive: true,
      emailVerifiedAt: new Date(),
      lastLoginAt: new Date(Date.now() - 3600000),
    },
  });

  const rizkyProfile = await prisma.candidateProfile.upsert({
    where: { userId: rizkyUser.id },
    update: {
      cvSummaryText:
        "Junior Web Developer familiar with HTML/CSS, basic JavaScript, Express.js tutorials, and simple MySQL queries.",
      portfolioUrl: "https://github.com/rizky-webdev",
      skills: ["JavaScript", "HTML", "CSS", "Express.js", "MySQL"],
      isOpenToPool: true,
    },
    create: {
      userId: rizkyUser.id,
      cvSummaryText:
        "Junior Web Developer familiar with HTML/CSS, basic JavaScript, Express.js tutorials, and simple MySQL queries.",
      portfolioUrl: "https://github.com/rizky-webdev",
      skills: ["JavaScript", "HTML", "CSS", "Express.js", "MySQL"],
      isOpenToPool: true,
    },
  });
  console.log(`✅ Job Seeker 5 Profile: ${rizkyUser.name}`);

  // Rizky -> ASE Lab (Senior Systems): REJECTED (Score: 52)
  const rizkyAppAse = await prisma.jobApplication.upsert({
    where: {
      jobId_candidateProfileId: {
        jobId: aseJob1.id,
        candidateProfileId: rizkyProfile.id,
      },
    },
    update: { status: ApplicationStatus.REJECTED },
    create: {
      jobId: aseJob1.id,
      candidateProfileId: rizkyProfile.id,
      status: ApplicationStatus.REJECTED,
    },
  });

  await prisma.interviewSession.upsert({
    where: { applicationId: rizkyAppAse.id },
    update: {
      turnCount: 8,
      totalTokensUsed: 4320,
      completedAt: new Date(),
    },
    create: {
      applicationId: rizkyAppAse.id,
      turnCount: 8,
      totalTokensUsed: 4320,
      startedAt: new Date(Date.now() - 6000000),
      completedAt: new Date(Date.now() - 3000000),
      messages: [
        {
          id: "rr1",
          role: "assistant",
          content: "Halo Rizky! Bisakah Anda jelaskan bagaimana cara mengonfigurasi Docker networking host mode vs bridge?",
          timestamp: new Date(Date.now() - 5900000).toISOString(),
        },
        {
          id: "rr2",
          role: "user",
          content: "Saya biasanya pakai docker run biasa saja kak, belum pernah setting network custom di Linux.",
          timestamp: new Date(Date.now() - 5800000).toISOString(),
        },
      ],
    },
  });

  await prisma.evaluation.upsert({
    where: { applicationId: rizkyAppAse.id },
    update: {
      matchScore: 52,
      domainScore: 46,
      implicitBehaviorScore: 58,
      evalTokensUsed: 1100,
      executiveSummary:
        "Kandidat belum memenuhi kualifikasi teknis minimum untuk Senior Systems Engineer. Pemahaman Linux networking dan container internals masih di tingkat pemula.",
      greenFlags: ["Jujur mengakui batasan pengetahuan"],
      redFlags: ["Tidak memiliki pengalaman praktis Linux server production", "Jawaban dangkal terkait isolasi cgroups dan failure recovery"],
      finalInterviewProbes: ["Sarankan program pelatihan magang dasar sebelum melamar posisi Senior"],
      traitBreakdown: [
        { traitName: "Containerization & Linux", score: 45, reasoning: "Hanya familiar dengan perintah dasar docker run tanpa pemahaman kernel isolasi." },
        { traitName: "Stress Tolerance & On-Call", score: 58, reasoning: "Belum memiliki pengalaman menghadapi production incident di luar jam kerja." },
      ],
    },
    create: {
      applicationId: rizkyAppAse.id,
      matchScore: 52,
      domainScore: 46,
      implicitBehaviorScore: 58,
      evalTokensUsed: 1100,
      executiveSummary:
        "Kandidat belum memenuhi kualifikasi teknis minimum untuk Senior Systems Engineer. Pemahaman Linux networking dan container internals masih di tingkat pemula.",
      greenFlags: ["Jujur mengakui batasan pengetahuan"],
      redFlags: ["Tidak memiliki pengalaman praktis Linux server production", "Jawaban dangkal terkait isolasi cgroups dan failure recovery"],
      finalInterviewProbes: ["Sarankan program pelatihan magang dasar sebelum melamar posisi Senior"],
      traitBreakdown: [
        { traitName: "Containerization & Linux", score: 45, reasoning: "Hanya familiar dengan perintah dasar docker run tanpa pemahaman kernel isolasi." },
        { traitName: "Stress Tolerance & On-Call", score: 58, reasoning: "Belum memiliki pengalaman menghadapi production incident di luar jam kerja." },
      ],
    },
  });

  // ---------------------------------------------------------------------------
  // 9. Job Seeker 6: Dimas Suryo (Fresh Applicant: REGISTERED)
  // ---------------------------------------------------------------------------
  const dimasUser = await prisma.user.upsert({
    where: { email: "dimas@example.com" },
    update: {
      name: "Dimas Suryo",
      systemRole: SystemRole.JOB_SEEKER,
      isActive: true,
      emailVerifiedAt: new Date(),
      lastLoginAt: new Date(Date.now() - 3600000),
      passwordHash: hashPassword("dimas123"),
    },
    create: {
      name: "Dimas Suryo",
      email: "dimas@example.com",
      passwordHash: hashPassword("dimas123"),
      systemRole: SystemRole.JOB_SEEKER,
      isActive: true,
      emailVerifiedAt: new Date(),
      lastLoginAt: new Date(Date.now() - 3600000),
    },
  });

  const dimasProfile = await prisma.candidateProfile.upsert({
    where: { userId: dimasUser.id },
    update: {
      cvSummaryText:
        "Aspiring Cloud DevOps enthusiast with certifications in AWS Cloud Practitioner and Terraform basics.",
      portfolioUrl: "https://linkedin.com/in/dimassuryo-devops",
      skills: ["AWS", "Terraform", "Docker", "Linux", "Bash"],
      isOpenToPool: true,
    },
    create: {
      userId: dimasUser.id,
      cvSummaryText:
        "Aspiring Cloud DevOps enthusiast with certifications in AWS Cloud Practitioner and Terraform basics.",
      portfolioUrl: "https://linkedin.com/in/dimassuryo-devops",
      skills: ["AWS", "Terraform", "Docker", "Linux", "Bash"],
      isOpenToPool: true,
    },
  });
  console.log(`✅ Job Seeker 6 Profile: ${dimasUser.name}`);

  // Dimas -> ASE Lab (Senior Systems): REGISTERED (Waiting for candidate to begin interview)
  await prisma.jobApplication.upsert({
    where: {
      jobId_candidateProfileId: {
        jobId: aseJob1.id,
        candidateProfileId: dimasProfile.id,
      },
    },
    update: { status: ApplicationStatus.REGISTERED },
    create: {
      jobId: aseJob1.id,
      candidateProfileId: dimasProfile.id,
      status: ApplicationStatus.REGISTERED,
    },
  });

  // ---------------------------------------------------------------------------
  // 10. Sample Invoices (Midtrans billing history)
  // ---------------------------------------------------------------------------
  await prisma.invoice.upsert({
    where: { orderId: "INV-ASE-20261020-001" },
    update: {
      status: InvoiceStatus.PAID,
      paidAt: new Date(Date.now() - 6 * 86400000),
      fulfilledAt: new Date(Date.now() - 6 * 86400000),
    },
    create: {
      organizationId: aseOrg.id,
      createdById: aseAdminUser.id,
      orderId: "INV-ASE-20261020-001",
      plan: PlanTier.SME_PRO,
      description: "Langganan SME Pro (30 Hari) - ASE Research Lab",
      amount: 499000,
      quotaGranted: 750,
      periodDays: 30,
      status: InvoiceStatus.PAID,
      paymentType: "qris",
      midtransTransactionId: "mid-seed-ase-01",
      paidAt: new Date(Date.now() - 6 * 86400000),
      fulfilledAt: new Date(Date.now() - 6 * 86400000),
    },
  });

  await prisma.invoice.upsert({
    where: { orderId: "INV-NUSA-20261022-002" },
    update: {
      status: InvoiceStatus.PAID,
      paidAt: new Date(Date.now() - 4 * 86400000),
      fulfilledAt: new Date(Date.now() - 4 * 86400000),
    },
    create: {
      organizationId: nusantaraOrg.id,
      createdById: nusantaraAdminUser.id,
      orderId: "INV-NUSA-20261022-002",
      plan: PlanTier.PAY_PER_OPREC,
      description: "Paket Pay-per-Oprec (150 Kuota) - Nusantara Tech Startup",
      amount: 149000,
      quotaGranted: 150,
      periodDays: null,
      status: InvoiceStatus.PAID,
      paymentType: "bank_transfer",
      midtransTransactionId: "mid-seed-nusa-01",
      paidAt: new Date(Date.now() - 4 * 86400000),
      fulfilledAt: new Date(Date.now() - 4 * 86400000),
    },
  });

  await prisma.invoice.upsert({
    where: { orderId: "INV-ASE-20261026-003" },
    update: {
      status: InvoiceStatus.PENDING,
    },
    create: {
      organizationId: aseOrg.id,
      createdById: aseAdminUser.id,
      orderId: "INV-ASE-20261026-003",
      plan: PlanTier.PAY_PER_OPREC,
      description: "Top-up Kuota Tambahan (150 Pelamar) - ASE Research Lab",
      amount: 149000,
      quotaGranted: 150,
      periodDays: null,
      status: InvoiceStatus.PENDING,
      snapToken: "snap-token-demo-seed-001",
      snapRedirectUrl: "https://app.sandbox.midtrans.com/snap/v2/vtweb/mock",
    },
  });
  console.log("✅ Sample Invoices created/updated");

  // ---------------------------------------------------------------------------
  // 11. Sample Audit Logs
  // ---------------------------------------------------------------------------
  // Delete existing seed audit logs to prevent duplicates on re-seed
  await prisma.auditLog.deleteMany({
    where: {
      actorEmail: {
        in: [superAdmin.email, aseAdminUser.email, aseLeadUser.email, nusantaraAdminUser.email, dewiUser.email],
      },
    },
  });

  const sampleAuditLogs = [
    {
      actorId: superAdmin.id,
      actorEmail: superAdmin.email,
      action: AuditAction.USER_LOGIN,
      targetType: "user",
      targetId: superAdmin.id,
      metadata: { method: "password" },
      createdAt: new Date(Date.now() - 7 * 86400000),
    },
    {
      actorId: aseAdminUser.id,
      actorEmail: aseAdminUser.email,
      organizationId: aseOrg.id,
      action: AuditAction.ORG_CREATED,
      targetType: "organization",
      targetId: aseOrg.id,
      metadata: { name: aseOrg.name, plan: aseOrg.planTier },
      createdAt: new Date(Date.now() - 6 * 86400000 - 3600000),
    },
    {
      actorId: aseAdminUser.id,
      actorEmail: aseAdminUser.email,
      organizationId: aseOrg.id,
      action: AuditAction.BILLING_PAYMENT_SUCCEEDED,
      targetType: "invoice",
      targetId: "INV-ASE-20261020-001",
      metadata: { amount: 499000, plan: "SME_PRO", quotaGranted: 750 },
      createdAt: new Date(Date.now() - 6 * 86400000),
    },
    {
      actorId: aseAdminUser.id,
      actorEmail: aseAdminUser.email,
      organizationId: aseOrg.id,
      action: AuditAction.MEMBER_INVITED,
      targetType: "member",
      metadata: { email: "budi@aselab.id", role: "DIVISION_LEAD" },
      createdAt: new Date(Date.now() - 5 * 86400000),
    },
    {
      actorId: aseLeadUser.id,
      actorEmail: aseLeadUser.email,
      organizationId: aseOrg.id,
      action: AuditAction.MEMBER_JOINED,
      targetType: "member",
      targetId: aseLeadUser.id,
      metadata: { role: "DIVISION_LEAD" },
      createdAt: new Date(Date.now() - 5 * 86400000 + 1800000),
    },
    {
      actorId: nusantaraAdminUser.id,
      actorEmail: nusantaraAdminUser.email,
      organizationId: nusantaraOrg.id,
      action: AuditAction.BILLING_PAYMENT_SUCCEEDED,
      targetType: "invoice",
      targetId: "INV-NUSA-20261022-002",
      metadata: { amount: 149000, plan: "PAY_PER_OPREC", quotaGranted: 150 },
      createdAt: new Date(Date.now() - 4 * 86400000),
    },
    {
      actorId: dewiUser.id,
      actorEmail: dewiUser.email,
      organizationId: aseOrg.id,
      action: AuditAction.APPLICATION_STATUS_CHANGED,
      targetType: "application",
      metadata: { job: "aselab-senior-systems", newStatus: "SHORTLISTED" },
      createdAt: new Date(Date.now() - 2 * 86400000),
    },
  ];

  for (const log of sampleAuditLogs) {
    await prisma.auditLog.create({
      data: log,
    });
  }
  console.log("✅ Sample Audit Logs seeded");

  console.log("✨ Seed completed successfully! All organizations, jobs, profiles, and applications are up to date.");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
