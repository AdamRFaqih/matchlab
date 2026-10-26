"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  createSession,
  destroyCurrentSession,
  getSession,
  setSessionActiveOrg,
} from "@/lib/auth/session";
import { assertUser, assertVerifiedUser, homePathFor, toActionError } from "@/lib/auth/guards";
import { validatePasswordStrength } from "@/lib/auth/password";
import { getClientIp } from "@/lib/request";
import { rateLimit } from "@/lib/rate-limit";
import { recordAudit, AuditAction } from "@/lib/audit";
import {
  authenticate,
  changePassword,
  createUserAccount,
  deleteUserAccount,
  normalizeEmail,
  requestPasswordReset,
  resetPasswordWithToken,
  safeNextPath,
  sendVerificationEmail,
} from "./service";
import {
  acceptInvitation,
  createOrganizationForUser,
  getInvitationByToken,
} from "@/modules/team/service";

/**
 * Form-state shape used with React `useActionState`.
 * On success most actions `redirect()`; otherwise they return an error/message.
 */
export interface FormState {
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
}

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const raw = (fd: FormData, key: string) => String(fd.get(key) ?? "");

async function limitOrError(key: string, limit: number, windowMs: number): Promise<string | null> {
  const ip = (await getClientIp()) ?? "unknown";
  const r = rateLimit(`${key}:${ip}`, limit, windowMs);
  return r.ok ? null : `Terlalu banyak percobaan. Coba lagi dalam ${r.retryAfterSeconds} detik.`;
}

/* ----------------------------------------------------------------------------------------- */
/* Sign up / Login / Logout                                                                   */
/* ----------------------------------------------------------------------------------------- */

const SignupSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter.").max(100),
  email: z.string().email("Format email tidak valid.").max(254),
  password: z.string(),
  accountType: z.enum(["JOB_SEEKER", "COMPANY_USER"]),
});

export async function signupAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const limited = await limitOrError("signup", 10, 60 * 60 * 1000);
  if (limited) return { error: limited };

  const parsed = SignupSchema.safeParse({
    name: str(fd, "name"),
    email: str(fd, "email"),
    password: raw(fd, "password"),
    accountType: str(fd, "accountType") || "JOB_SEEKER",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { error: "Periksa kembali data Anda.", fieldErrors };
  }
  if (!fd.get("acceptTerms")) {
    return { error: "Anda harus menyetujui Syarat & Ketentuan serta Kebijakan Privasi.", fieldErrors: { acceptTerms: "Wajib disetujui." } };
  }
  const pwError = validatePasswordStrength(parsed.data.password);
  if (pwError) return { error: pwError, fieldErrors: { password: pwError } };

  const inviteToken = str(fd, "inviteToken");
  const next = safeNextPath(str(fd, "next"));
  let destination: string;

  try {
    // Signing up through an invitation link: the account is created as a company user,
    // pre-verified (the invite was delivered to this email), and joined to the org.
    if (inviteToken) {
      const inv = await getInvitationByToken(inviteToken);
      if (!inv) return { error: "Undangan tidak valid atau sudah kedaluwarsa." };
      if (normalizeEmail(parsed.data.email) !== inv.email) {
        return { error: `Undangan ini ditujukan untuk ${inv.email}.`, fieldErrors: { email: "Email tidak sesuai undangan." } };
      }
      const user = await createUserAccount({ ...parsed.data, systemRole: "COMPANY_USER", emailVerified: true });
      const orgId = await acceptInvitation(inviteToken, user);
      await createSession(user.id, orgId);
      destination = "/dashboard";
    } else {
      const user = await createUserAccount({ ...parsed.data, systemRole: parsed.data.accountType });
      await sendVerificationEmail(user);
      await createSession(user.id);
      destination = `/verify-email${next ? `?next=${encodeURIComponent(next)}` : ""}`;
    }
  } catch (e) {
    return { error: toActionError(e, "Gagal membuat akun.") };
  }

  redirect(destination);
}

export async function loginAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = normalizeEmail(str(fd, "email"));
  const password = raw(fd, "password");
  if (!email || !password) return { error: "Email dan password wajib diisi." };

  const limited =
    (await limitOrError("login", 20, 15 * 60 * 1000)) ??
    (rateLimit(`login-email:${email}`, 8, 15 * 60 * 1000).ok ? null : "Terlalu banyak percobaan untuk akun ini. Coba lagi dalam 15 menit.");
  if (limited) return { error: limited };

  const result = await authenticate(email, password);
  if (!result.ok) {
    return {
      error:
        result.reason === "suspended"
          ? "Akun Anda dinonaktifkan. Hubungi support MatchLab."
          : "Email atau password salah.",
    };
  }

  const firstOrg = await db.organizationMember.findFirst({
    where: { userId: result.user.id },
    orderBy: { createdAt: "asc" },
    select: { organizationId: true },
  });
  await createSession(result.user.id, firstOrg?.organizationId);

  const next = safeNextPath(str(fd, "next"));
  if (!result.user.emailVerifiedAt) {
    redirect(`/verify-email${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  }
  redirect(
    next ??
      homePathFor({
        systemRole: result.user.systemRole,
        memberships: firstOrg ? [firstOrg] : [],
      })
  );
}

export async function logoutAction(): Promise<void> {
  const user = await getSession();
  await destroyCurrentSession();
  if (user) await recordAudit({ action: AuditAction.USER_LOGOUT, actorId: user.id, actorEmail: user.email });
  redirect("/login");
}

/* ----------------------------------------------------------------------------------------- */
/* Email verification & password reset                                                        */
/* ----------------------------------------------------------------------------------------- */

export async function resendVerificationAction(_prev: FormState): Promise<FormState> {
  try {
    const user = await assertUser();
    if (user.emailVerified) return { message: "Email Anda sudah terverifikasi." };
    const r = rateLimit(`verify-resend:${user.id}`, 3, 15 * 60 * 1000);
    if (!r.ok) return { error: `Tunggu ${r.retryAfterSeconds} detik sebelum mengirim ulang.` };
    await sendVerificationEmail(user);
    return { message: `Email verifikasi telah dikirim ke ${user.email}.` };
  } catch (e) {
    return { error: toActionError(e) };
  }
}

export async function forgotPasswordAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const limited = await limitOrError("forgot", 5, 15 * 60 * 1000);
  if (limited) return { error: limited };
  const email = str(fd, "email");
  if (!z.string().email().safeParse(email).success) return { error: "Format email tidak valid." };
  try {
    await requestPasswordReset(email);
  } catch (e) {
    console.error("[auth] password reset request failed", e);
  }
  return { message: "Jika email terdaftar, tautan untuk mengatur ulang password telah dikirim." };
}

export async function resetPasswordAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const token = str(fd, "token");
  const password = raw(fd, "password");
  const confirm = raw(fd, "confirmPassword");
  if (password !== confirm) return { error: "Konfirmasi password tidak sama.", fieldErrors: { confirmPassword: "Tidak sama." } };
  const pwError = validatePasswordStrength(password);
  if (pwError) return { error: pwError, fieldErrors: { password: pwError } };

  const ok = await resetPasswordWithToken(token, password);
  if (!ok) return { error: "Tautan reset tidak valid atau sudah kedaluwarsa. Minta tautan baru." };
  redirect("/login?reset=1");
}

/* ----------------------------------------------------------------------------------------- */
/* Organization onboarding, switching & invitations                                           */
/* ----------------------------------------------------------------------------------------- */

export async function createOrganizationAction(_prev: FormState, fd: FormData): Promise<FormState> {
  try {
    const user = await assertVerifiedUser();
    if (user.systemRole !== "COMPANY_USER") {
      return { error: "Hanya akun perusahaan/organisasi yang dapat membuat organisasi." };
    }
    const name = str(fd, "name");
    if (name.length < 2 || name.length > 100) return { error: "Nama organisasi 2–100 karakter.", fieldErrors: { name: "2–100 karakter." } };
    const org = await createOrganizationForUser(user, {
      name,
      cultureDescription: str(fd, "cultureDescription").slice(0, 4000),
    });
    await setSessionActiveOrg(user.sessionId, org.id);
  } catch (e) {
    return { error: toActionError(e, "Gagal membuat organisasi.") };
  }
  redirect("/dashboard?welcome=1");
}

export async function switchOrganizationAction(organizationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await assertVerifiedUser();
    if (!user.memberships.some((m) => m.organizationId === organizationId)) {
      return { success: false, error: "Anda bukan anggota organisasi ini." };
    }
    await setSessionActiveOrg(user.sessionId, organizationId);
    return { success: true };
  } catch (e) {
    return { success: false, error: toActionError(e) };
  }
}

export async function acceptInvitationAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const token = str(fd, "token");
  try {
    const user = await assertUser();
    const orgId = await acceptInvitation(token, user);
    await setSessionActiveOrg(user.sessionId, orgId);
  } catch (e) {
    return { error: toActionError(e, "Gagal menerima undangan.") };
  }
  redirect("/dashboard");
}

/* ----------------------------------------------------------------------------------------- */
/* Account settings                                                                           */
/* ----------------------------------------------------------------------------------------- */

export async function updateAccountProfileAction(_prev: FormState, fd: FormData): Promise<FormState> {
  try {
    const user = await assertUser();
    const name = str(fd, "name");
    if (name.length < 2 || name.length > 100) return { error: "Nama 2–100 karakter.", fieldErrors: { name: "2–100 karakter." } };
    await db.user.update({ where: { id: user.id }, data: { name } });
    await recordAudit({ action: AuditAction.USER_PROFILE_UPDATED, actorId: user.id, actorEmail: user.email });
    return { message: "Profil berhasil diperbarui." };
  } catch (e) {
    return { error: toActionError(e) };
  }
}

export async function changePasswordAction(_prev: FormState, fd: FormData): Promise<FormState> {
  try {
    const user = await assertUser();
    const current = raw(fd, "currentPassword");
    const next = raw(fd, "newPassword");
    if (next !== raw(fd, "confirmPassword")) return { error: "Konfirmasi password tidak sama." };
    const pwError = validatePasswordStrength(next);
    if (pwError) return { error: pwError };
    const r = rateLimit(`change-pw:${user.id}`, 5, 15 * 60 * 1000);
    if (!r.ok) return { error: `Terlalu banyak percobaan. Coba lagi dalam ${r.retryAfterSeconds} detik.` };
    await changePassword(user.id, current, next, user.sessionId);
    return { message: "Password berhasil diubah. Sesi di perangkat lain telah dikeluarkan." };
  } catch (e) {
    return { error: toActionError(e, "Gagal mengubah password.") };
  }
}

export async function signOutOtherSessionsAction(): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await assertUser();
    await db.session.deleteMany({ where: { userId: user.id, id: { not: user.sessionId } } });
    return { success: true };
  } catch (e) {
    return { success: false, error: toActionError(e) };
  }
}

export async function deleteAccountAction(_prev: FormState, fd: FormData): Promise<FormState> {
  try {
    const user = await assertUser();
    if (str(fd, "confirm") !== "HAPUS") return { error: 'Ketik "HAPUS" untuk konfirmasi.' };
    await deleteUserAccount(user.id, raw(fd, "password"));
    await destroyCurrentSession();
  } catch (e) {
    return { error: toActionError(e, "Gagal menghapus akun.") };
  }
  redirect("/?account_deleted=1");
}
