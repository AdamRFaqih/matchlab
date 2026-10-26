-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('PAY_PER_OPREC', 'SME_PRO');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('REGISTERED', 'IN_PROGRESS', 'COMPLETED_SCREENING', 'EVALUATED', 'SHORTLISTED', 'REJECTED');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "planTier" "PlanTier" NOT NULL DEFAULT 'PAY_PER_OPREC',
    "applicantQuota" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobRequisition" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "rawUserPrompt" TEXT NOT NULL,
    "generatedSpec" JSONB NOT NULL,
    "scoringRubric" JSONB NOT NULL,
    "maxTurns" INTEGER NOT NULL DEFAULT 8,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobRequisition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cvSummaryText" TEXT NOT NULL,
    "portfolioUrl" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'REGISTERED',
    "clientIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewSession" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "messages" JSONB NOT NULL DEFAULT '[]',
    "turnCount" INTEGER NOT NULL DEFAULT 0,
    "totalTokensUsed" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "InterviewSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "matchScore" INTEGER NOT NULL,
    "domainScore" INTEGER NOT NULL,
    "implicitBehaviorScore" INTEGER NOT NULL,
    "executiveSummary" TEXT NOT NULL,
    "traitBreakdown" JSONB NOT NULL,
    "greenFlags" TEXT[],
    "redFlags" TEXT[],
    "finalInterviewProbes" TEXT[],
    "evalTokensUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "JobRequisition_slug_key" ON "JobRequisition"("slug");

-- CreateIndex
CREATE INDEX "JobRequisition_organizationId_idx" ON "JobRequisition"("organizationId");

-- CreateIndex
CREATE INDEX "Candidate_jobId_status_idx" ON "Candidate"("jobId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_jobId_email_key" ON "Candidate"("jobId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewSession_candidateId_key" ON "InterviewSession"("candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "Evaluation_candidateId_key" ON "Evaluation"("candidateId");

-- CreateIndex
CREATE INDEX "Evaluation_matchScore_idx" ON "Evaluation"("matchScore" DESC);

-- AddForeignKey
ALTER TABLE "JobRequisition" ADD CONSTRAINT "JobRequisition_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobRequisition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

