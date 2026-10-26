import { NextResponse } from "next/server";
import {
  getTransactionStatus,
  verifyNotificationSignature,
  type MidtransNotification,
} from "@/lib/billing/midtrans";
import { applyPaymentStatus } from "@/lib/billing/service";

export const dynamic = "force-dynamic";

/**
 * Midtrans HTTP(S) notification webhook.
 * Set in Midtrans Dashboard → Settings → Payment → Notification URL:
 *   {NEXT_PUBLIC_APP_URL}/api/billing/midtrans/notification
 */
export async function POST(request: Request) {
  let body: MidtransNotification;
  try {
    body = (await request.json()) as MidtransNotification;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  if (!body?.order_id || !verifyNotificationSignature(body)) {
    return NextResponse.json({ ok: false, error: "invalid signature" }, { status: 401 });
  }

  try {
    // Defence in depth: trust Midtrans' status API over the posted payload when reachable.
    const authoritative = (await getTransactionStatus(body.order_id).catch(() => null)) ?? body;
    const status = await applyPaymentStatus(authoritative);
    // Unknown order ids are acknowledged so Midtrans stops retrying (e.g. dashboard test pings).
    return NextResponse.json({ ok: true, status });
  } catch (error) {
    console.error("[billing] Failed to process Midtrans notification", error);
    // 500 → Midtrans retries later.
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
