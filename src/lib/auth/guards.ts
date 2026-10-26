import "server-only";
import { redirect } from "next/navigation";
import type { OrgRole } from "@prisma/client";
import { db } from "@/lib/db";
import { getSession } from "./session";
import type { AuthUser } from "./types";

/**
 * Authorization helpers.
 *
 * - `require*` helpers are for Server Components / pages: they `redirect()` when access is denied.
 * - `assert*` helpers are for Server Actions / Route Handlers: they throw `AuthError`, which
 *   actions should catch and convert into `{ success: false, error }`.
 *
 * Tenant isolation rule: every query touching tenant data MUST be scoped by an organizationId
 * obtained from one of these helpers — never trust an organizationId sent by the client
 * without checking membership.
 */

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: "UNAUTHENTICATED" | "FORBIDDEN" | "UNVERIFIED" | "SUSPENDED" = "FORBIDDEN"
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export function isAuthError(e: unknown): e is AuthError {
  return e instanceof AuthError;
}

/** Converts any thrown error into a safe action error message. */
export function toActionError(e: unknown, fallback = "Terjadi kesalahan. Silakan coba lagi."): string {
  if (isAuthError(e)) return e.message;
  if (e instanceof Error && process.env.NODE_ENV !== "production") return e.message;
  return fallback;
}

export interface OrgContext {
  user: AuthUser;
  organizationId: string;
  orgRole: OrgRole | "SUPER_ADMIN";
  isOrgAdmin: boolean;
}

/* ------------------------------------------------------------------------------------------ */
/* Page guards (redirect)                                                                      */
/* ------------------------------------------------------------------------------------------ */

export async function requireUser(nextPath?: string): Promise<AuthUser> {
  const user = await getSession();
  if (!user) {
    redirect(nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login");
  }
  return user;
}

export async function requireVerifiedUser(nextPath?: string): Promise<AuthUser> {
  const user = await requireUser(nextPath);
  if (!user.emailVerified) redirect("/verify-email");
  return user;
}

export async function requireSuperAdmin(): Promise<AuthUser> {
  const user = await requireUser("/super-admin");
  if (user.systemRole !== "SUPER_ADMIN") redirect(homePathFor(user));
  return user;
}

export async function requireJobSeeker(nextPath?: string): Promise<AuthUser> {
  const user = await requireVerifiedUser(nextPath);
  if (user.systemRole !== "JOB_SEEKER") redirect(homePathFor(user));
  return user;
}

/**
 * Requires membership in the active organization. Company users without an organization
 * are sent to onboarding. Super admins may access any org only via `assertOrgAccess`.
 */
export async function requireOrgMember(options?: { adminOnly?: boolean; nextPath?: string }): Promise<OrgContext> {
  const user = await requireVerifiedUser(options?.nextPath ?? "/dashboard");

  if (user.systemRole === "JOB_SEEKER") redirect("/candidate/dashboard");
  if (!user.activeOrgId || !user.activeOrgRole) {
    if (user.systemRole === "SUPER_ADMIN") redirect("/super-admin");
    redirect("/onboarding");
  }

  const isOrgAdmin = user.activeOrgRole === "ORG_ADMIN";
  if (options?.adminOnly && !isOrgAdmin) redirect("/dashboard");

  return { user, organizationId: user.activeOrgId, orgRole: user.activeOrgRole, isOrgAdmin };
}

export function homePathFor(user: { systemRole: AuthUser["systemRole"]; memberships: readonly unknown[] }): string {
  if (user.systemRole === "SUPER_ADMIN") return "/super-admin";
  if (user.systemRole === "JOB_SEEKER") return "/candidate/dashboard";
  return user.memberships.length > 0 ? "/dashboard" : "/onboarding";
}

/* ------------------------------------------------------------------------------------------ */
/* Action guards (throw)                                                                       */
/* ------------------------------------------------------------------------------------------ */

export async function assertUser(): Promise<AuthUser> {
  const user = await getSession();
  if (!user) throw new AuthError("Silakan masuk terlebih dahulu.", "UNAUTHENTICATED");
  return user;
}

export async function assertVerifiedUser(): Promise<AuthUser> {
  const user = await assertUser();
  if (!user.emailVerified) throw new AuthError("Verifikasi email Anda terlebih dahulu.", "UNVERIFIED");
  return user;
}

export async function assertSuperAdmin(): Promise<AuthUser> {
  const user = await assertUser();
  if (user.systemRole !== "SUPER_ADMIN") throw new AuthError("Akses khusus Super Admin.");
  return user;
}

export async function assertJobSeeker(): Promise<AuthUser & { candidateProfileId?: string }> {
  const user = await assertVerifiedUser();
  if (user.systemRole !== "JOB_SEEKER") throw new AuthError("Akses khusus pencari kerja.");
  return user;
}

/**
 * Asserts the current user may act within `organizationId` (defaults to the active org).
 * Super admins are allowed on any organization (for support), with ORG_ADMIN-level rights.
 */
export async function assertOrgAccess(
  organizationId?: string,
  options?: { adminOnly?: boolean }
): Promise<OrgContext> {
  const user = await assertVerifiedUser();
  const orgId = organizationId ?? user.activeOrgId;

  if (!orgId) throw new AuthError("Anda belum tergabung dalam organisasi.");

  if (user.systemRole === "SUPER_ADMIN") {
    return { user, organizationId: orgId, orgRole: "SUPER_ADMIN", isOrgAdmin: true };
  }

  const membership = user.memberships.find((m) => m.organizationId === orgId);
  if (!membership) throw new AuthError("Anda tidak memiliki akses ke organisasi ini.");

  const isOrgAdmin = membership.orgRole === "ORG_ADMIN";
  if (options?.adminOnly && !isOrgAdmin) {
    throw new AuthError("Hanya Org Admin yang dapat melakukan aksi ini.");
  }

  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: { isSuspended: true },
  });
  if (!org) throw new AuthError("Organisasi tidak ditemukan.");
  if (org.isSuspended) throw new AuthError("Organisasi ini sedang ditangguhkan. Hubungi support.", "SUSPENDED");

  return { user, organizationId: orgId, orgRole: membership.orgRole, isOrgAdmin };
}

/** Asserts access to the organization that owns a job requisition. Returns the org context. */
export async function assertJobAccess(jobId: string, options?: { adminOnly?: boolean }) {
  const job = await db.jobRequisition.findUnique({
    where: { id: jobId },
    select: { organizationId: true },
  });
  if (!job) throw new AuthError("Lowongan tidak ditemukan.");
  return assertOrgAccess(job.organizationId, options);
}

/** Asserts access to the organization that owns a job application. */
export async function assertApplicationAccess(applicationId: string) {
  const app = await db.jobApplication.findUnique({
    where: { id: applicationId },
    select: { job: { select: { organizationId: true } } },
  });
  if (!app) throw new AuthError("Lamaran tidak ditemukan.");
  return assertOrgAccess(app.job.organizationId);
}
