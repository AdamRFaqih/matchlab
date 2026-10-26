import type { Metadata } from "next";
import { requireOrgMember } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getQuotaSummary } from "@/lib/billing/quota";
import { isMidtransConfigured } from "@/lib/billing/midtrans";
import { refreshInvoiceFromMidtrans } from "@/lib/billing/service";
import { BillingDashboardView } from "@/modules/billing/components/BillingDashboardView";

export const metadata: Metadata = {
  title: "Paket & Tagihan",
  description: "Kelola kuota dan pembayaran paket rekrutmen.",
};

export default async function BillingPage(props: {
  searchParams: Promise<{ plan?: string; order_id?: string }>;
}) {
  const searchParams = await props.searchParams;
  const ctx = await requireOrgMember({ adminOnly: true });

  let orderStatusResult = null;
  if (searchParams.order_id) {
    orderStatusResult = await refreshInvoiceFromMidtrans(searchParams.order_id);
  }

  const quota = await getQuotaSummary(ctx.organizationId);

  const org = await db.organization.findUniqueOrThrow({
    where: { id: ctx.organizationId },
    select: { name: true },
  });

  const invoices = await db.invoice.findMany({
    where: { organizationId: ctx.organizationId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <BillingDashboardView
      organizationName={org.name}
      quota={
        quota || {
          planTier: "FREE",
          planName: "Free",
          total: 20,
          used: 0,
          remaining: 20,
          percentage: 0,
          currentPeriodEnd: null,
          isExpired: false,
          maxActiveJobs: 1,
          maxMembers: 2,
        }
      }
      invoices={invoices}
      midtransReady={isMidtransConfigured()}
      highlightTier={searchParams.plan}
      orderStatusResult={orderStatusResult}
    />
  );
}
