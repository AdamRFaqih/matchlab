-- CreateEnum
CREATE TYPE "SystemRole" AS ENUM ('SUPER_ADMIN', 'COMPANY_USER', 'JOB_SEEKER');

-- CreateEnum
CREATE TYPE "OrgRole" AS ENUM ('ORG_ADMIN', 'DIVISION_LEAD');

-- CreateEnum
CREATE TYPE "AuthTokenType" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'EXPIRED', 'CANCELED', 'REFUNDED');

-- DropForeignKey
ALTER TABLE "Candidate" DROP CONSTRAINT IF EXISTS "Candidate_jobId_fkey";

-- DropForeignKey
ALTER TABLE "InterviewSession" DROP CONSTRAINT IF EXISTS "InterviewSession_candidateId_fkey";

-- DropForeignKey
ALTER TABLE "Evaluation" DROP CONSTRAINT IF EXISTS "Evaluation_candidateId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "InterviewSession_candidateId_key";

-- DropIndex
DROP INDEX IF EXISTS "Evaluation_candidateId_key";

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "applicantsUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "billingEmail" TEXT,
ADD COLUMN IF NOT EXISTS "cultureDescription" TEXT,
ADD COLUMN IF NOT EXISTS "currentPeriodEnd" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "isSuspended" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "planTier" SET DEFAULT 'FREE',
ALTER COLUMN "applicantQuota" SET DEFAULT 20;

-- AlterTable
ALTER TABLE "InterviewSession" DROP COLUMN IF EXISTS "candidateId",
ADD COLUMN IF NOT EXISTS "applicationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Evaluation" DROP COLUMN IF EXISTS "candidateId",
ADD COLUMN IF NOT EXISTS "applicationId" TEXT NOT NULL;

-- DropTable
DROP TABLE IF EXISTS "Candidate";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "systemRole" "SystemRole" NOT NULL DEFAULT 'JOB_SEEKER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerifiedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activeOrgId" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AuthTokenType" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "orgRole" "OrgRole" NOT NULL DEFAULT 'DIVISION_LEAD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationInvitation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "orgRole" "OrgRole" NOT NULL DEFAULT 'DIVISION_LEAD',
    "tokenHash" TEXT NOT NULL,
    "invitedById" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cvSummaryText" TEXT NOT NULL,
    "portfolioUrl" TEXT,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isOpenToPool" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobApplication" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "candidateProfileId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'REGISTERED',
    "clientIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT,
    "orderId" TEXT NOT NULL,
    "plan" "PlanTier" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "quotaGranted" INTEGER NOT NULL,
    "periodDays" INTEGER,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "snapToken" TEXT,
    "snapRedirectUrl" TEXT,
    "paymentType" TEXT,
    "midtransTransactionId" TEXT,
    "rawNotification" JSONB,
    "paidAt" TIMESTAMP(3),
    "fulfilledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "organizationId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_systemRole_idx" ON "User"("systemRole");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "AuthToken_tokenHash_key" ON "AuthToken"("tokenHash");

-- CreateIndex
CREATE INDEX "AuthToken_userId_type_idx" ON "AuthToken"("userId", "type");

-- CreateIndex
CREATE INDEX "OrganizationMember_organizationId_idx" ON "OrganizationMember"("organizationId");

-- CreateIndex
CREATE INDEX "OrganizationMember_userId_idx" ON "OrganizationMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_userId_organizationId_key" ON "OrganizationMember"("userId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationInvitation_tokenHash_key" ON "OrganizationInvitation"("tokenHash");

-- CreateIndex
CREATE INDEX "OrganizationInvitation_organizationId_idx" ON "OrganizationInvitation"("organizationId");

-- CreateIndex
CREATE INDEX "OrganizationInvitation_email_idx" ON "OrganizationInvitation"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateProfile_userId_key" ON "CandidateProfile"("userId");

-- CreateIndex
CREATE INDEX "CandidateProfile_isOpenToPool_idx" ON "CandidateProfile"("isOpenToPool");

-- CreateIndex
CREATE INDEX "JobApplication_jobId_status_idx" ON "JobApplication"("jobId", "status");

-- CreateIndex
CREATE INDEX "JobApplication_candidateProfileId_idx" ON "JobApplication"("candidateProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "JobApplication_jobId_candidateProfileId_key" ON "JobApplication"("jobId", "candidateProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_orderId_key" ON "Invoice"("orderId");

-- CreateIndex
CREATE INDEX "Invoice_organizationId_createdAt_idx" ON "Invoice"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_createdAt_idx" ON "AuditLog"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewSession_applicationId_key" ON "InterviewSession"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "Evaluation_applicationId_key" ON "Evaluation"("applicationId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthToken" ADD CONSTRAINT "AuthToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationInvitation" ADD CONSTRAINT "OrganizationInvitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationInvitation" ADD CONSTRAINT "OrganizationInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateProfile" ADD CONSTRAINT "CandidateProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobRequisition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_candidateProfileId_fkey" FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
