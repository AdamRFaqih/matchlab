import type { SystemRole, OrgRole } from "@prisma/client";

export const SESSION_COOKIE_NAME = "matchlab_session_uid";
export const ACTIVE_ORG_COOKIE_NAME = "matchlab_active_org_id";

export interface AuthMembership {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  orgRole: OrgRole;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  systemRole: SystemRole;
  isActive: boolean;
  candidateProfileId?: string;
  memberships: AuthMembership[];
  activeOrgId?: string;
  activeOrgRole?: OrgRole;
}

export const DEMO_ROLES = [
  {
    label: "Super Admin",
    description: "Platform Owner & Control Panel Access",
    email: "admin@matchlab.id",
    systemRole: "SUPER_ADMIN" as SystemRole,
  },
  {
    label: "Org Admin (ASE Lab)",
    description: "Company & Quota Admin for ASE Lab",
    email: "hendra@aselab.id",
    systemRole: "COMPANY_USER" as SystemRole,
    orgRole: "ORG_ADMIN" as OrgRole,
    orgSlug: "aselab",
  },
  {
    label: "Division Lead (ASE Lab)",
    description: "Job Creator & AI Screening Evaluator",
    email: "budi@aselab.id",
    systemRole: "COMPANY_USER" as SystemRole,
    orgRole: "DIVISION_LEAD" as OrgRole,
    orgSlug: "aselab",
  },
  {
    label: "Org Admin (Nusantara Tech)",
    description: "Admin for Nusantara Tech Startup",
    email: "siti@nusantaratech.id",
    systemRole: "COMPANY_USER" as SystemRole,
    orgRole: "ORG_ADMIN" as OrgRole,
    orgSlug: "nusantara-tech",
  },
  {
    label: "Job Seeker (Dewi Lestari)",
    description: "Senior Fullstack Engineer Candidate",
    email: "dewi@example.com",
    systemRole: "JOB_SEEKER" as SystemRole,
  },
  {
    label: "Job Seeker (Fajar Pratama)",
    description: "Junior AI/Backend Candidate",
    email: "fajar@example.com",
    systemRole: "JOB_SEEKER" as SystemRole,
  },
] as const;

export const DEFAULT_SUPER_ADMIN_MOCK: AuthUser = {
  id: "super-admin-root",
  name: "Super Admin",
  email: "admin@matchlab.id",
  systemRole: "SUPER_ADMIN",
  isActive: true,
  memberships: [],
};
