import type { PlanTier, SystemRole, OrgRole } from "@prisma/client";

export interface SuperAdminKpi {
  totalCompanies: number;
  totalJobSeekers: number;
  totalActiveJobs: number;
  totalTokensUsed: number;
  estimatedIdrCost: number;
}

export interface CompanyItem {
  id: string;
  name: string;
  slug: string;
  planTier: PlanTier;
  applicantQuota: number;
  isVerified: boolean;
  cultureDescription: string | null;
  jobCount: number;
  memberCount: number;
  createdAt: Date;
}

export interface UserItem {
  id: string;
  name: string;
  email: string;
  systemRole: SystemRole;
  isActive: boolean;
  createdAt: Date;
  organizations: Array<{
    name: string;
    orgRole: OrgRole;
  }>;
  hasCandidateProfile: boolean;
  skills: string[];
}

export interface SuperAdminDashboardData {
  kpis: SuperAdminKpi;
  companies: CompanyItem[];
  users: UserItem[];
}
