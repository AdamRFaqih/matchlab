import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getClientIp } from "@/lib/request";

/**
 * Canonical audit actions. Free-form strings are allowed, but prefer these constants
 * so the Super Admin audit log can be filtered consistently.
 */
export const AuditAction = {
  USER_SIGNUP: "user.signup",
  USER_LOGIN: "user.login",
  USER_LOGIN_FAILED: "user.login_failed",
  USER_LOGOUT: "user.logout",
  USER_EMAIL_VERIFIED: "user.email_verified",
  USER_PASSWORD_RESET_REQUESTED: "user.password_reset_requested",
  USER_PASSWORD_RESET: "user.password_reset",
  USER_PASSWORD_CHANGED: "user.password_changed",
  USER_PROFILE_UPDATED: "user.profile_updated",
  USER_DELETED: "user.deleted",
  USER_STATUS_CHANGED: "user.status_changed",

  ORG_CREATED: "org.created",
  ORG_UPDATED: "org.updated",
  ORG_VERIFIED: "org.verification_changed",
  ORG_SUSPENDED: "org.suspension_changed",
  ORG_PLAN_CHANGED: "org.plan_changed",
  ORG_QUOTA_CHANGED: "org.quota_changed",

  MEMBER_INVITED: "member.invited",
  MEMBER_INVITE_REVOKED: "member.invite_revoked",
  MEMBER_JOINED: "member.joined",
  MEMBER_ROLE_CHANGED: "member.role_changed",
  MEMBER_REMOVED: "member.removed",

  JOB_CREATED: "job.created",
  JOB_UPDATED: "job.updated",
  JOB_STATUS_CHANGED: "job.status_changed",
  JOB_DELETED: "job.deleted",

  APPLICATION_STATUS_CHANGED: "application.status_changed",

  BILLING_CHECKOUT_CREATED: "billing.checkout_created",
  BILLING_PAYMENT_SUCCEEDED: "billing.payment_succeeded",
  BILLING_PAYMENT_FAILED: "billing.payment_failed",
} as const;

export type AuditActionValue = (typeof AuditAction)[keyof typeof AuditAction] | (string & {});

export interface AuditEntry {
  action: AuditActionValue;
  actorId?: string | null;
  actorEmail?: string | null;
  organizationId?: string | null;
  targetType?: string;
  targetId?: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
}

/**
 * Writes an audit log entry. Never throws — auditing must not break the user flow.
 */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    let ip = entry.ipAddress;
    if (ip === undefined) {
      try {
        ip = await getClientIp();
      } catch {
        ip = undefined; // called outside a request scope (e.g. webhook helpers / scripts)
      }
    }

    await db.auditLog.create({
      data: {
        action: entry.action,
        actorId: entry.actorId ?? null,
        actorEmail: entry.actorEmail ?? null,
        organizationId: entry.organizationId ?? null,
        targetType: entry.targetType,
        targetId: entry.targetId,
        metadata: entry.metadata,
        ipAddress: ip ?? null,
      },
    });
  } catch (error) {
    console.error("[audit] Failed to record audit entry", entry.action, error);
  }
}
