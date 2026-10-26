"use server";

import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { SESSION_COOKIE_NAME, ACTIVE_ORG_COOKIE_NAME } from "./types";

/**
 * Server action to switch user or role identity
 */
export async function switchSessionUserAction(emailOrUserId: string, targetOrgId?: string) {
  const cookieStore = await cookies();

  try {
    const user = await db.user.findFirst({
      where: {
        OR: [{ id: emailOrUserId }, { email: emailOrUserId }],
      },
      include: {
        memberships: true,
      },
    });

    if (user) {
      cookieStore.set(SESSION_COOKIE_NAME, user.id, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      const chosenOrgId = targetOrgId || user.memberships[0]?.organizationId;
      if (chosenOrgId) {
        cookieStore.set(ACTIVE_ORG_COOKIE_NAME, chosenOrgId, {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7,
        });
      } else {
        cookieStore.delete(ACTIVE_ORG_COOKIE_NAME);
      }

      return { success: true, user: { id: user.id, email: user.email, name: user.name } };
    }
  } catch (e) {
    console.warn("DB lookup failed in switchSessionUserAction:", e);
  }

  // Fallback to setting identifier directly as cookie if offline
  cookieStore.set(SESSION_COOKIE_NAME, emailOrUserId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });

  return { success: true };
}

/**
 * Server action to clear current session
 */
export async function clearSessionAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  cookieStore.delete(ACTIVE_ORG_COOKIE_NAME);
  return { success: true };
}
