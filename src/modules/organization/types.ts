import type { PlanTier } from "@prisma/client";

export interface OrganizationDashboardJob {
  id: string;
  title: string;
  slug: string;
  maxTurns: number;
  isActive: boolean;
  createdAt: Date;
  totalApplicants: number;
  evaluatedCount: number;
  shortlistedCount: number;
}

export interface OrganizationDashboardData {
  organization: {
    id: string;
    name: string;
    slug: string;
    planTier: PlanTier;
    applicantQuota: number;
    applicantsUsed: number;
    billingEmail: string | null;
    cultureDescription: string | null;
    isVerified: boolean;
    isSuspended: boolean;
    currentPeriodEnd: Date | null;
  };
  jobs: OrganizationDashboardJob[];
  quota: {
    used: number;
    total: number;
    remaining: number;
    percentage: number;
    isExpired?: boolean;
  };
  isOrgAdmin: boolean;
}
