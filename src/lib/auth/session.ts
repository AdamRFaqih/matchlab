import { cookies } from "next/headers";
import { db } from "@/lib/db";
import {
  SESSION_COOKIE_NAME,
  ACTIVE_ORG_COOKIE_NAME,
  DEFAULT_SUPER_ADMIN_MOCK,
  type AuthUser,
  type AuthMembership,
} from "./types";

export * from "./types";
export * from "./actions";

/**
 * Retrieves the current session user from cookies and database.
 */
export async function getSession(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionUid = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const activeOrgId = cookieStore.get(ACTIVE_ORG_COOKIE_NAME)?.value;

    if (!sessionUid) {
      return DEFAULT_SUPER_ADMIN_MOCK;
    }

    const user = await db.user.findUnique({
      where: { id: sessionUid },
      include: {
        candidateProfile: {
          select: { id: true },
        },
        memberships: {
          include: {
            organization: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
    });

    if (!user) {
      return DEFAULT_SUPER_ADMIN_MOCK;
    }

    const memberships: AuthMembership[] = user.memberships.map((m) => ({
      id: m.id,
      organizationId: m.organization.id,
      organizationName: m.organization.name,
      organizationSlug: m.organization.slug,
      orgRole: m.orgRole,
    }));

    const matchedMembership = activeOrgId
      ? memberships.find((m) => m.organizationId === activeOrgId)
      : memberships[0];

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      systemRole: user.systemRole,
      isActive: user.isActive,
      candidateProfileId: user.candidateProfile?.id,
      memberships,
      activeOrgId: matchedMembership?.organizationId,
      activeOrgRole: matchedMembership?.orgRole,
    };
  } catch (error) {
    console.warn("Unable to fetch session from DB, using fallback mock session:", error);
    return DEFAULT_SUPER_ADMIN_MOCK;
  }
}
