import "server-only";
import crypto from "node:crypto";
import type { InvoiceStatus, PlanTier } from "@prisma/client";
import { db } from "@/lib/db";
import { getAppUrl } from "@/lib/request";
import { recordAudit, AuditAction } from "@/lib/audit";
import { sendEmail } from "@/lib/email";
import { paymentReceiptEmail } from "@/lib/email/templates";
import { PLANS, formatIdr } from "./plans";
import {
  createSnapTransaction,
  getTransactionStatus,
  isMidtransConfigured,
  normalizeMidtransStatus,
  type MidtransNotification,
} from "./midtrans";

function generateOrderId() {
  return `ML-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

export interface CheckoutResult {
  invoiceId: string;
  orderId: string;
  redirectUrl: string;
  snapToken: string;
}

/**
 * Creates a PENDING invoice and a Midtrans Snap transaction. Caller must have already
 * authorized the user as ORG_ADMIN of `organizationId`.
 */
export async function createCheckout(params: {
  organizationId: string;
  plan: PlanTier;
  user: { id: string; name: string; email: string };
}): Promise<CheckoutResult> {
  const plan = PLANS[params.plan];
  if (!plan?.purchasable) throw new Error("Paket ini tidak dapat dibeli.");
  if (!isMidtransConfigured()) {
    throw new Error("Pembayaran belum dikonfigurasi (MIDTRANS_SERVER_KEY). Hubungi administrator.");
  }

  const org = await db.organization.findUnique({
    where: { id: params.organizationId },
    select: { id: true, name: true, billingEmail: true, isSuspended: true },
  });
  if (!org) throw new Error("Organisasi tidak ditemukan.");
  if (org.isSuspended) throw new Error("Organisasi sedang ditangguhkan.");

  const orderId = generateOrderId();
  const description =
    plan.billing === "monthly" ? `${plan.name} — ${plan.periodDays} hari` : `${plan.name} — ${plan.applicantQuota} kredit pelamar`;

  const invoice = await db.invoice.create({
    data: {
      organizationId: org.id,
      createdById: params.user.id,
      orderId,
      plan: plan.tier,
      description,
      amount: plan.price,
      quotaGranted: plan.applicantQuota,
      periodDays: plan.periodDays ?? null,
      status: "PENDING",
    },
  });

  try {
    const snap = await createSnapTransaction({
      orderId,
      grossAmount: plan.price,
      item: { id: plan.tier, name: description, price: plan.price, quantity: 1 },
      customer: { firstName: params.user.name, email: org.billingEmail || params.user.email },
      finishUrl: `${getAppUrl()}/dashboard/billing?order_id=${encodeURIComponent(orderId)}`,
    });

    await db.invoice.update({
      where: { id: invoice.id },
      data: { snapToken: snap.token, snapRedirectUrl: snap.redirectUrl },
    });

    await recordAudit({
      action: AuditAction.BILLING_CHECKOUT_CREATED,
      actorId: params.user.id,
      actorEmail: params.user.email,
      organizationId: org.id,
      targetType: "Invoice",
      targetId: invoice.id,
      metadata: { orderId, plan: plan.tier, amount: plan.price },
    });

    return { invoiceId: invoice.id, orderId, redirectUrl: snap.redirectUrl, snapToken: snap.token };
  } catch (error) {
    await db.invoice.update({ where: { id: invoice.id }, data: { status: "FAILED" } });
    throw error;
  }
}

/**
 * Applies a Midtrans status to the invoice. Idempotent: quota is granted at most once, guarded
 * by the `fulfilledAt` column. Safe to call from both the webhook and the finish-redirect page.
 */
export async function applyPaymentStatus(notification: MidtransNotification): Promise<InvoiceStatus | null> {
  const invoice = await db.invoice.findUnique({ where: { orderId: notification.order_id } });
  if (!invoice) return null;

  // Amount must match what we charged.
  if (Math.round(Number(notification.gross_amount)) !== invoice.amount) {
    console.error("[billing] Gross amount mismatch for", invoice.orderId, notification.gross_amount);
    return invoice.status;
  }

  const status = normalizeMidtransStatus(notification);

  if (status !== "PAID") {
    // Never downgrade a PAID invoice except via refund.
    if (invoice.status === "PAID" && status !== "REFUNDED") return invoice.status;
    if (invoice.status !== status) {
      await db.invoice.update({
        where: { id: invoice.id },
        data: {
          status,
          paymentType: notification.payment_type ?? invoice.paymentType,
          midtransTransactionId: notification.transaction_id ?? invoice.midtransTransactionId,
          rawNotification: notification as object,
        },
      });
      if (status === "FAILED" || status === "EXPIRED" || status === "CANCELED") {
        await recordAudit({
          action: AuditAction.BILLING_PAYMENT_FAILED,
          organizationId: invoice.organizationId,
          targetType: "Invoice",
          targetId: invoice.id,
          metadata: { orderId: invoice.orderId, status },
          ipAddress: null,
        });
      }
    }
    return status;
  }

  // PAID → claim fulfillment exactly once.
  const fulfilled = await db.$transaction(async (tx) => {
    const claim = await tx.invoice.updateMany({
      where: { id: invoice.id, fulfilledAt: null },
      data: {
        status: "PAID",
        paidAt: new Date(),
        fulfilledAt: new Date(),
        paymentType: notification.payment_type ?? null,
        midtransTransactionId: notification.transaction_id ?? null,
        rawNotification: notification as object,
      },
    });
    if (claim.count === 0) return false;

    const org = await tx.organization.findUniqueOrThrow({ where: { id: invoice.organizationId } });
    const now = new Date();
    const proActive = org.planTier === "SME_PRO" && org.currentPeriodEnd && org.currentPeriodEnd > now;

    if (invoice.plan === "SME_PRO") {
      const base = proActive && org.currentPeriodEnd ? org.currentPeriodEnd : now;
      const periodEnd = new Date(base.getTime() + (invoice.periodDays ?? 30) * 24 * 60 * 60 * 1000);
      const carry = Math.max(0, org.applicantQuota - org.applicantsUsed);
      await tx.organization.update({
        where: { id: org.id },
        data: {
          planTier: "SME_PRO",
          currentPeriodEnd: periodEnd,
          applicantQuota: org.applicantsUsed + carry + invoice.quotaGranted,
          isVerified: true,
        },
      });
    } else {
      await tx.organization.update({
        where: { id: org.id },
        data: {
          planTier: proActive ? "SME_PRO" : "PAY_PER_OPREC",
          applicantQuota: { increment: invoice.quotaGranted },
        },
      });
    }
    return true;
  });

  if (fulfilled) {
    await recordAudit({
      action: AuditAction.BILLING_PAYMENT_SUCCEEDED,
      organizationId: invoice.organizationId,
      targetType: "Invoice",
      targetId: invoice.id,
      metadata: { orderId: invoice.orderId, plan: invoice.plan, amount: invoice.amount, quotaGranted: invoice.quotaGranted },
      ipAddress: null,
    });

    const org = await db.organization.findUnique({
      where: { id: invoice.organizationId },
      select: { name: true, billingEmail: true, members: { where: { orgRole: "ORG_ADMIN" }, select: { user: { select: { email: true } } }, take: 1 } },
    });
    const to = org?.billingEmail || org?.members[0]?.user.email;
    if (org && to) {
      const mail = paymentReceiptEmail({
        organizationName: org.name,
        description: invoice.description,
        amountFormatted: formatIdr(invoice.amount),
        orderId: invoice.orderId,
        url: `${getAppUrl()}/dashboard/billing`,
      });
      await sendEmail({ to, ...mail });
    }
  }

  return "PAID";
}

/**
 * Re-checks a pending invoice directly with Midtrans (used on the finish-redirect page so the
 * user sees the result even if the webhook is delayed).
 */
export async function refreshInvoiceFromMidtrans(orderId: string): Promise<InvoiceStatus | null> {
  if (!isMidtransConfigured()) return null;
  const status = await getTransactionStatus(orderId).catch(() => null);
  if (!status) return null;
  return applyPaymentStatus(status);
}
