import "server-only";
import crypto from "node:crypto";

/**
 * Midtrans Snap integration (https://docs.midtrans.com/docs/snap-snap-integration-guide).
 *
 * Env:
 *  - MIDTRANS_SERVER_KEY      (required for checkout + webhook verification)
 *  - MIDTRANS_CLIENT_KEY      (optional, only needed for the embedded Snap popup)
 *  - MIDTRANS_IS_PRODUCTION   ("true" for live; defaults to sandbox)
 *
 * Configure the Payment Notification URL in the Midtrans dashboard to:
 *   {NEXT_PUBLIC_APP_URL}/api/billing/midtrans/notification
 */

export function isMidtransConfigured(): boolean {
  return Boolean(process.env.MIDTRANS_SERVER_KEY);
}

export function isMidtransProduction(): boolean {
  return process.env.MIDTRANS_IS_PRODUCTION === "true";
}

function snapBaseUrl() {
  return isMidtransProduction() ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com";
}

function coreBaseUrl() {
  return isMidtransProduction() ? "https://api.midtrans.com" : "https://api.sandbox.midtrans.com";
}

function authHeader() {
  const key = process.env.MIDTRANS_SERVER_KEY;
  if (!key) throw new Error("MIDTRANS_SERVER_KEY belum dikonfigurasi.");
  return `Basic ${Buffer.from(`${key}:`).toString("base64")}`;
}

export interface SnapTransactionInput {
  orderId: string;
  grossAmount: number;
  item: { id: string; name: string; price: number; quantity: number };
  customer: { firstName: string; email: string };
  finishUrl: string;
  /** Expiry of the payment page in minutes. */
  expiryMinutes?: number;
}

export interface SnapTransactionResult {
  token: string;
  redirectUrl: string;
}

export async function createSnapTransaction(input: SnapTransactionInput): Promise<SnapTransactionResult> {
  const res = await fetch(`${snapBaseUrl()}/snap/v1/transactions`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: authHeader(),
    },
    body: JSON.stringify({
      transaction_details: { order_id: input.orderId, gross_amount: input.grossAmount },
      item_details: [
        {
          id: input.item.id,
          name: input.item.name.slice(0, 50),
          price: input.item.price,
          quantity: input.item.quantity,
        },
      ],
      customer_details: { first_name: input.customer.firstName, email: input.customer.email },
      callbacks: { finish: input.finishUrl },
      expiry: { unit: "minutes", duration: input.expiryMinutes ?? 60 * 24 },
      credit_card: { secure: true },
    }),
    cache: "no-store",
  });

  const data = (await res.json().catch(() => ({}))) as {
    token?: string;
    redirect_url?: string;
    error_messages?: string[];
  };

  if (!res.ok || !data.token || !data.redirect_url) {
    throw new Error(
      `Midtrans error (${res.status}): ${data.error_messages?.join(", ") || "unknown error"}`
    );
  }

  return { token: data.token, redirectUrl: data.redirect_url };
}

export interface MidtransNotification {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status:
    | "capture"
    | "settlement"
    | "pending"
    | "deny"
    | "cancel"
    | "expire"
    | "failure"
    | "refund"
    | "partial_refund"
    | "authorize";
  fraud_status?: "accept" | "deny" | "challenge";
  payment_type?: string;
  transaction_id?: string;
  [key: string]: unknown;
}

/** Verifies `signature_key = SHA512(order_id + status_code + gross_amount + server_key)`. */
export function verifyNotificationSignature(n: Pick<MidtransNotification, "order_id" | "status_code" | "gross_amount" | "signature_key">): boolean {
  const key = process.env.MIDTRANS_SERVER_KEY;
  if (!key || !n.signature_key) return false;
  const expected = crypto
    .createHash("sha512")
    .update(`${n.order_id}${n.status_code}${n.gross_amount}${key}`)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(String(n.signature_key));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Fetches the authoritative transaction status from Midtrans (defence in depth for webhooks). */
export async function getTransactionStatus(orderId: string): Promise<MidtransNotification | null> {
  const res = await fetch(`${coreBaseUrl()}/v2/${encodeURIComponent(orderId)}/status`, {
    headers: { Accept: "application/json", Authorization: authHeader() },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as MidtransNotification;
  if (!data.transaction_status) return null;
  return data;
}

export type NormalizedPaymentStatus = "PAID" | "PENDING" | "FAILED" | "EXPIRED" | "CANCELED" | "REFUNDED";

export function normalizeMidtransStatus(n: Pick<MidtransNotification, "transaction_status" | "fraud_status">): NormalizedPaymentStatus {
  switch (n.transaction_status) {
    case "capture":
      return n.fraud_status === "accept" || !n.fraud_status ? "PAID" : "PENDING";
    case "settlement":
      return "PAID";
    case "pending":
    case "authorize":
      return "PENDING";
    case "expire":
      return "EXPIRED";
    case "cancel":
      return "CANCELED";
    case "refund":
    case "partial_refund":
      return "REFUNDED";
    case "deny":
    case "failure":
    default:
      return "FAILED";
  }
}
