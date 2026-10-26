import "server-only";
import type { OrgRole } from "@prisma/client";
import { db } from "@/lib/db";
import { generateToken, hashToken } from "@/lib/auth/tokens";
import { sendEmail } from "@/lib/email";
import { invitationEmail } from "@/lib/email/templates";
import { getAppUrl } from "@/lib/request";
import { recordAudit, AuditAction } from "@/lib/audit";
import { checkMemberLimit } from "@/lib/billing/quota";
import { PLANS } from "@/lib/billing/plans";
import { normalizeEmail } from "@/modules/auth/service";

const INVITE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export const ORG_ROLE_LABEL: Record<OrgRole, string> = {
  ORG_ADMIN: "Org Admin",
  DIVISION_LEAD: "Division Lead",
};

type Actor = { id: string; name: string; email: string };

/* ----------------------------------------------------------------------------------------- */
/* Organization onboarding                                                                    */
/* ----------------------------------------------------------------------------------------- */

export function slugifyOrgName(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "org"
  );
}

const RESERVED_SLUGS = new Set([
  "admin", "api", "app", "apply", "billing", "candidate", "dashboard", "jobs", "login",
  "logout", "matchlab", "onboarding", "pricing", "privacy", "settings", "signup", "super-admin",
  "support", "terms", "www",
]);

export async function generateUniqueOrgSlug(base: string): Promise<string> {
  const root = slugifyOrgName(base);
  let slug = RESERVED_SLUGS.has(root) ? `${root}-org` : root;
  let i = 1;
  while (await db.organization.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${root}-${++i}`;
  }
  return slug;
}

/** Creates an organization on the FREE plan with the actor as ORG_ADMIN. */
export async function createOrganizationForUser(actor: Actor, input: { name: string; cultureDescription?: string }) {
  const slug = await generateUniqueOrgSlug(input.name);
  const free = PLANS.FREE;

  const org = await db.organization.create({
    data: {
      name: input.name.trim(),
      slug,
      planTier: "FREE",
      applicantQuota: free.applicantQuota,
      applicantsUsed: 0,
      billingEmail: actor.email,
      cultureDescription: input.cultureDescription?.trim() || null,
      members: { create: { userId: actor.id, orgRole: "ORG_ADMIN" } },
    },
  });

  await recordAudit({
    action: AuditAction.ORG_CREATED,
    actorId: actor.id,
    actorEmail: actor.email,
    organizationId: org.id,
    targetType: "Organization",
    targetId: org.id,
    metadata: { name: org.name, slug: org.slug },
  });

  return org;
}

/* ----------------------------------------------------------------------------------------- */
/* Members                                                                                    */
/* ----------------------------------------------------------------------------------------- */

export async function listTeam(organizationId: string) {
  const [members, invitations] = await Promise.all([
    db.organizationMember.findMany({
      where: { organizationId },
      include: { user: { select: { id: true, name: true, email: true, lastLoginAt: true, isActive: true } } },
      orderBy: { createdAt: "asc" },
    }),
    db.organizationInvitation.findMany({
      where: { organizationId, acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
      include: { invitedBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return { members, invitations };
}

async function assertNotLastAdmin(organizationId: string, memberUserId: string) {
  const admins = await db.organizationMember.count({
    where: { organizationId, orgRole: "ORG_ADMIN", userId: { not: memberUserId } },
  });
  if (admins === 0) throw new Error("Organisasi harus memiliki minimal satu Org Admin.");
}

export async function changeMemberRole(actor: Actor, organizationId: string, memberId: string, orgRole: OrgRole) {
  const member = await db.organizationMember.findFirst({ where: { id: memberId, organizationId } });
  if (!member) throw new Error("Anggota tidak ditemukan.");
  if (member.orgRole === orgRole) return;
  if (member.orgRole === "ORG_ADMIN") await assertNotLastAdmin(organizationId, member.userId);

  await db.organizationMember.update({ where: { id: member.id }, data: { orgRole } });
  await recordAudit({
    action: AuditAction.MEMBER_ROLE_CHANGED,
    actorId: actor.id,
    actorEmail: actor.email,
    organizationId,
    targetType: "User",
    targetId: member.userId,
    metadata: { from: member.orgRole, to: orgRole },
  });
}

export async function removeMember(actor: Actor, organizationId: string, memberId: string) {
  const member = await db.organizationMember.findFirst({ where: { id: memberId, organizationId } });
  if (!member) throw new Error("Anggota tidak ditemukan.");
  if (member.orgRole === "ORG_ADMIN") await assertNotLastAdmin(organizationId, member.userId);

  await db.organizationMember.delete({ where: { id: member.id } });
  // Drop the org context from the removed user's sessions.
  await db.session.updateMany({
    where: { userId: member.userId, activeOrgId: organizationId },
    data: { activeOrgId: null },
  });
  await recordAudit({
    action: AuditAction.MEMBER_REMOVED,
    actorId: actor.id,
    actorEmail: actor.email,
    organizationId,
    targetType: "User",
    targetId: member.userId,
  });
}

/* ----------------------------------------------------------------------------------------- */
/* Invitations                                                                                */
/* ----------------------------------------------------------------------------------------- */

export async function inviteMember(actor: Actor, organizationId: string, emailRaw: string, orgRole: OrgRole) {
  const email = normalizeEmail(emailRaw);

  const existingMember = await db.organizationMember.findFirst({
    where: { organizationId, user: { email } },
    select: { id: true },
  });
  if (existingMember) throw new Error("Pengguna ini sudah menjadi anggota organisasi.");

  const existingUser = await db.user.findUnique({ where: { email }, select: { systemRole: true } });
  if (existingUser && existingUser.systemRole !== "COMPANY_USER") {
    throw new Error("Email ini terdaftar sebagai akun pencari kerja/admin platform dan tidak dapat diundang ke tim.");
  }

  // Re-inviting the same email replaces the previous pending invite (doesn't count twice).
  await db.organizationInvitation.updateMany({
    where: { organizationId, email, acceptedAt: null, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  const limitError = await checkMemberLimit(organizationId);
  if (limitError) throw new Error(limitError);

  const org = await db.organization.findUniqueOrThrow({ where: { id: organizationId }, select: { name: true } });
  const token = generateToken();
  const invitation = await db.organizationInvitation.create({
    data: {
      organizationId,
      email,
      orgRole,
      tokenHash: hashToken(token),
      invitedById: actor.id,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    },
  });

  const url = `${getAppUrl()}/invite/${token}`;
  const mail = await sendEmail({
    to: email,
    ...invitationEmail({
      inviterName: actor.name,
      organizationName: org.name,
      roleLabel: ORG_ROLE_LABEL[orgRole],
      url,
    }),
  });

  await recordAudit({
    action: AuditAction.MEMBER_INVITED,
    actorId: actor.id,
    actorEmail: actor.email,
    organizationId,
    targetType: "OrganizationInvitation",
    targetId: invitation.id,
    metadata: { email, orgRole },
  });

  // When email isn't configured the admin can share the link manually.
  return { invitationId: invitation.id, inviteUrl: mail.delivered === "console" ? url : undefined, emailSent: mail.ok };
}

export async function revokeInvitation(actor: Actor, organizationId: string, invitationId: string) {
  const res = await db.organizationInvitation.updateMany({
    where: { id: invitationId, organizationId, acceptedAt: null, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (res.count === 0) throw new Error("Undangan tidak ditemukan atau sudah tidak aktif.");
  await recordAudit({
    action: AuditAction.MEMBER_INVITE_REVOKED,
    actorId: actor.id,
    actorEmail: actor.email,
    organizationId,
    targetType: "OrganizationInvitation",
    targetId: invitationId,
  });
}

/** Looks up a still-valid invitation by its raw token. */
export async function getInvitationByToken(token: string) {
  const inv = await db.organizationInvitation.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      organization: { select: { id: true, name: true, slug: true, isSuspended: true } },
      invitedBy: { select: { name: true } },
    },
  });
  if (!inv || inv.acceptedAt || inv.revokedAt || inv.expiresAt < new Date() || inv.organization.isSuspended) {
    return null;
  }
  return inv;
}

/**
 * Accepts an invitation for an existing, logged-in user whose email matches the invite.
 * Returns the organizationId joined.
 */
export async function acceptInvitation(token: string, user: { id: string; email: string; systemRole: string }) {
  const inv = await getInvitationByToken(token);
  if (!inv) throw new Error("Undangan tidak valid atau sudah kedaluwarsa.");
  if (normalizeEmail(user.email) !== inv.email) {
    throw new Error(`Undangan ini ditujukan untuk ${inv.email}. Masuk dengan akun tersebut.`);
  }
  if (user.systemRole !== "COMPANY_USER") {
    throw new Error("Akun pencari kerja tidak dapat bergabung ke tim organisasi.");
  }

  await db.$transaction(async (tx) => {
    const claimed = await tx.organizationInvitation.updateMany({
      where: { id: inv.id, acceptedAt: null, revokedAt: null },
      data: { acceptedAt: new Date() },
    });
    if (claimed.count === 0) throw new Error("Undangan sudah digunakan.");
    await tx.organizationMember.upsert({
      where: { userId_organizationId: { userId: user.id, organizationId: inv.organizationId } },
      update: {},
      create: { userId: user.id, organizationId: inv.organizationId, orgRole: inv.orgRole },
    });
    // Accepting an emailed invite proves ownership of the address.
    await tx.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
    });
  });

  await recordAudit({
    action: AuditAction.MEMBER_JOINED,
    actorId: user.id,
    actorEmail: user.email,
    organizationId: inv.organizationId,
    targetType: "OrganizationInvitation",
    targetId: inv.id,
    metadata: { orgRole: inv.orgRole },
  });

  return inv.organizationId;
}
