import "server-only";
import type { SystemRole } from "@prisma/client";
import { db } from "@/lib/db";
import { generateToken, hashToken } from "@/lib/auth/tokens";
import { hashPassword, needsRehash, verifyPassword } from "@/lib/auth/password";
import { sendEmail } from "@/lib/email";
import { passwordResetEmail, verificationEmail } from "@/lib/email/templates";
import { getAppUrl } from "@/lib/request";
import { recordAudit, AuditAction } from "@/lib/audit";

const VERIFY_TTL_MS = 1000 * 60 * 60 * 24; // 24h
const RESET_TTL_MS = 1000 * 60 * 60; // 1h

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Only allow same-origin relative redirects (prevents open redirects). */
export function safeNextPath(next: string | null | undefined): string | null {
  if (!next || typeof next !== "string") return null;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return null;
  return next;
}

export async function createUserAccount(params: {
  name: string;
  email: string;
  password: string;
  systemRole: Extract<SystemRole, "JOB_SEEKER" | "COMPANY_USER">;
  emailVerified?: boolean;
}) {
  const email = normalizeEmail(params.email);
  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    throw new Error("Email sudah terdaftar. Silakan masuk atau gunakan lupa password.");
  }

  const user = await db.user.create({
    data: {
      name: params.name.trim(),
      email,
      passwordHash: hashPassword(params.password),
      systemRole: params.systemRole,
      emailVerifiedAt: params.emailVerified ? new Date() : null,
      ...(params.systemRole === "JOB_SEEKER"
        ? { candidateProfile: { create: { cvSummaryText: "", skills: [] } } }
        : {}),
    },
  });

  await recordAudit({
    action: AuditAction.USER_SIGNUP,
    actorId: user.id,
    actorEmail: user.email,
    targetType: "User",
    targetId: user.id,
    metadata: { systemRole: user.systemRole },
  });

  return user;
}

/** Returns the user when the credentials are valid and the account is active; otherwise null. */
export async function authenticate(emailRaw: string, password: string) {
  const email = normalizeEmail(emailRaw);
  const user = await db.user.findUnique({ where: { email } });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    await recordAudit({
      action: AuditAction.USER_LOGIN_FAILED,
      actorId: user?.id ?? null,
      actorEmail: email,
    });
    return { ok: false as const, reason: "invalid" as const };
  }

  if (!user.isActive) {
    return { ok: false as const, reason: "suspended" as const };
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      lastLoginAt: new Date(),
      ...(needsRehash(user.passwordHash) ? { passwordHash: hashPassword(password) } : {}),
    },
  });

  await recordAudit({ action: AuditAction.USER_LOGIN, actorId: user.id, actorEmail: user.email });
  return { ok: true as const, user };
}

async function issueAuthToken(userId: string, type: "EMAIL_VERIFICATION" | "PASSWORD_RESET") {
  const token = generateToken();
  // Invalidate previous outstanding tokens of the same type.
  await db.authToken.updateMany({
    where: { userId, type, usedAt: null },
    data: { usedAt: new Date() },
  });
  await db.authToken.create({
    data: {
      userId,
      type,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + (type === "PASSWORD_RESET" ? RESET_TTL_MS : VERIFY_TTL_MS)),
    },
  });
  return token;
}

export async function sendVerificationEmail(user: { id: string; name: string; email: string }) {
  const token = await issueAuthToken(user.id, "EMAIL_VERIFICATION");
  const url = `${getAppUrl()}/verify-email/${token}`;
  return sendEmail({ to: user.email, ...verificationEmail(user.name, url) });
}

/** Consumes a single-use token. Returns the userId when valid. */
async function consumeAuthToken(token: string, type: "EMAIL_VERIFICATION" | "PASSWORD_RESET") {
  const record = await db.authToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record || record.type !== type || record.usedAt || record.expiresAt < new Date()) {
    return null;
  }
  const claimed = await db.authToken.updateMany({
    where: { id: record.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  return claimed.count === 1 ? record.userId : null;
}

export async function verifyEmailToken(token: string): Promise<boolean> {
  const userId = await consumeAuthToken(token, "EMAIL_VERIFICATION");
  if (!userId) return false;
  const user = await db.user.update({
    where: { id: userId },
    data: { emailVerifiedAt: new Date() },
  });
  await recordAudit({ action: AuditAction.USER_EMAIL_VERIFIED, actorId: user.id, actorEmail: user.email });
  return true;
}

/** Always resolves (no account enumeration). */
export async function requestPasswordReset(emailRaw: string): Promise<void> {
  const email = normalizeEmail(emailRaw);
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.isActive) return;
  const token = await issueAuthToken(user.id, "PASSWORD_RESET");
  const url = `${getAppUrl()}/reset-password/${token}`;
  await sendEmail({ to: user.email, ...passwordResetEmail(user.name, url) });
  await recordAudit({ action: AuditAction.USER_PASSWORD_RESET_REQUESTED, actorId: user.id, actorEmail: user.email });
}

export async function isPasswordResetTokenValid(token: string): Promise<boolean> {
  const record = await db.authToken.findUnique({ where: { tokenHash: hashToken(token) } });
  return Boolean(record && record.type === "PASSWORD_RESET" && !record.usedAt && record.expiresAt > new Date());
}

export async function resetPasswordWithToken(token: string, newPassword: string): Promise<boolean> {
  const userId = await consumeAuthToken(token, "PASSWORD_RESET");
  if (!userId) return false;
  const user = await db.user.update({
    where: { id: userId },
    // Receiving the reset email proves ownership of the address.
    data: { passwordHash: hashPassword(newPassword), emailVerifiedAt: new Date() },
  });
  await db.session.deleteMany({ where: { userId } });
  await recordAudit({ action: AuditAction.USER_PASSWORD_RESET, actorId: user.id, actorEmail: user.email });
  return true;
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string, keepSessionId: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (!verifyPassword(currentPassword, user.passwordHash)) {
    throw new Error("Password saat ini salah.");
  }
  await db.user.update({ where: { id: userId }, data: { passwordHash: hashPassword(newPassword) } });
  await db.session.deleteMany({ where: { userId, id: { not: keepSessionId } } });
  await recordAudit({ action: AuditAction.USER_PASSWORD_CHANGED, actorId: user.id, actorEmail: user.email });
}

/**
 * Deletes a user account. Organizations where the user is the only ORG_ADMIN:
 *  - if they are the sole member → the organization is deleted too;
 *  - otherwise deletion is blocked until another admin is assigned.
 */
export async function deleteUserAccount(userId: string, password: string) {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      memberships: {
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              members: { select: { userId: true, orgRole: true } },
            },
          },
        },
      },
    },
  });

  if (!verifyPassword(password, user.passwordHash)) throw new Error("Password salah.");
  if (user.systemRole === "SUPER_ADMIN") throw new Error("Akun Super Admin tidak dapat dihapus dari sini.");

  const orgsToDelete: string[] = [];
  for (const m of user.memberships) {
    if (m.orgRole !== "ORG_ADMIN") continue;
    const otherAdmins = m.organization.members.filter((x) => x.orgRole === "ORG_ADMIN" && x.userId !== userId);
    if (otherAdmins.length > 0) continue;
    if (m.organization.members.length > 1) {
      throw new Error(
        `Anda satu-satunya Org Admin di "${m.organization.name}". Jadikan anggota lain sebagai Org Admin terlebih dahulu.`
      );
    }
    orgsToDelete.push(m.organization.id);
  }

  await db.$transaction([
    db.organization.deleteMany({ where: { id: { in: orgsToDelete } } }),
    db.user.delete({ where: { id: userId } }),
  ]);

  await recordAudit({
    action: AuditAction.USER_DELETED,
    actorEmail: user.email,
    targetType: "User",
    targetId: userId,
    metadata: { deletedOrganizations: orgsToDelete },
  });
}
