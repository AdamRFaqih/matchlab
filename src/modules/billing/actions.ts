"use server";

import type { PlanTier } from "@prisma/client";
import { assertOrgAccess, toActionError } from "@/lib/auth/guards";
import { createCheckout } from "@/lib/billing/service";

export async function checkoutPlanAction(
  plan: PlanTier
): Promise<{ success: boolean; redirectUrl?: string; error?: string }> {
  try {
    const ctx = await assertOrgAccess(undefined, { adminOnly: true });

    const checkout = await createCheckout({
      organizationId: ctx.organizationId,
      plan,
      user: {
        id: ctx.user.id,
        name: ctx.user.name,
        email: ctx.user.email,
      },
    });

    return {
      success: true,
      redirectUrl: checkout.redirectUrl,
    };
  } catch (error) {
    return {
      success: false,
      error: toActionError(error, "Gagal membuat sesi pembayaran Midtrans."),
    };
  }
}
