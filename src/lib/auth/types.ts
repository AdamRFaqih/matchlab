import type { SystemRole, OrgRole } from "@prisma/client";

/** HttpOnly cookie that carries the opaque session token. */
export const SESSION_COOKIE_NAME = "matchlab_session";
/** Session lifetime (sliding — refreshed when the session is used after half its lifetime). */
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export interface AuthMembership {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  orgRole: OrgRole;
}

export interface AuthUser {
  id: string;
  sessionId: string;
  name: string;
  email: string;
  systemRole: SystemRole;
  isActive: boolean;
  emailVerified: boolean;
  candidateProfileId?: string;
  memberships: AuthMembership[];
  activeOrgId?: string;
  activeOrgRole?: OrgRole;
  activeOrgName?: string;
}

export type ActionResult<T = undefined> =
  | ({ success: true } & (T extends undefined ? object : { data: T }))
  | { success: false; error: string; fieldErrors?: Record<string, string> };
