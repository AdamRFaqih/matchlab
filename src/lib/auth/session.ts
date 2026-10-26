import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { generateToken, hashToken } from "./tokens";
import { getClientIp, getUserAgent } from "@/lib/request";
import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
  type AuthUser,
  type AuthMembership,
} from "./types";

export * from "./types";

function cookieOptions(expires: Date) {
  return {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    expires,
  };
}

/**
 * Creates a new DB-backed session for the user and sets the session cookie.
 * Must be called from a Server Action or Route Handler.
 */
export async function createSession(userId: string, activeOrgId?: string | null) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      activeOrgId: activeOrgId ?? null,
      expiresAt,
      ipAddress: (await getClientIp()) ?? null,
      userAgent: (await getUserAgent()) ?? null,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, cookieOptions(expiresAt));
}

/** Destroys the current session (DB row + cookie). */
export async function destroyCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await db.session.deleteMany({ where: { tokenHash: hashToken(token) } }).catch(() => undefined);
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/** Revokes every session of a user, optionally keeping one (e.g. the current one). */
export async function revokeAllUserSessions(userId: string, exceptSessionId?: string) {
  await db.session.deleteMany({
    where: { userId, ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}) },
  });
}

/** Sets the organization context of the current session. Caller must verify membership. */
export async function setSessionActiveOrg(sessionId: string, organizationId: string | null) {
  await db.session.update({ where: { id: sessionId }, data: { activeOrgId: organizationId } });
}

/**
 * Resolves the authenticated user for the current request, or `null`.
 * Memoised per request via React `cache`.
 *
 * Returns `null` for expired sessions and deactivated accounts. There is NO mock fallback:
 * if the database is unavailable the request is treated as unauthenticated.
 */
export const getSession = cache(async (): Promise<AuthUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const session = await db.session.findUnique({
      where: { tokenHash: hashToken(token) },
      include: {
        user: {
          include: {
            candidateProfile: { select: { id: true } },
            memberships: {
              include: {
                organization: { select: { id: true, name: true, slug: true } },
              },
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    const { user } = session;
    if (!user.isActive) {
      return null;
    }

    // Sliding expiration: extend when more than half of the lifetime has elapsed.
    const remaining = session.expiresAt.getTime() - Date.now();
    if (remaining < SESSION_TTL_MS / 2) {
      const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
      await db.session
        .update({ where: { id: session.id }, data: { expiresAt, lastSeenAt: new Date() } })
        .catch(() => undefined);
      try {
        cookieStore.set(SESSION_COOKIE_NAME, token, cookieOptions(expiresAt));
      } catch {
        // Cookies are read-only during Server Component rendering; the DB expiry still slides.
      }
    }

    const memberships: AuthMembership[] = user.memberships.map((m) => ({
      id: m.id,
      organizationId: m.organization.id,
      organizationName: m.organization.name,
      organizationSlug: m.organization.slug,
      orgRole: m.orgRole,
    }));

    const active =
      memberships.find((m) => m.organizationId === session.activeOrgId) ?? memberships[0];

    return {
      id: user.id,
      sessionId: session.id,
      name: user.name,
      email: user.email,
      systemRole: user.systemRole,
      isActive: user.isActive,
      emailVerified: Boolean(user.emailVerifiedAt),
      candidateProfileId: user.candidateProfile?.id,
      memberships,
      activeOrgId: active?.organizationId,
      activeOrgRole: active?.orgRole,
      activeOrgName: active?.organizationName,
    };
  } catch (error) {
    console.error("[auth] Failed to resolve session:", error);
    return null;
  }
});
