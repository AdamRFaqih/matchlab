"use client";

import { useState, useTransition } from "react";
import {
  CreditCard,
  Check,
  Loader2,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { PlanTier, InvoiceStatus } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PLANS, PLAN_ORDER, formatIdr } from "@/lib/billing/plans";
import type { QuotaSummary } from "@/lib/billing/quota";
import { checkoutPlanAction } from "../actions";

interface InvoiceItem {
  id: string;
  orderId: string;
  plan: PlanTier;
  description: string;
  amount: number;
  status: InvoiceStatus;
  snapRedirectUrl: string | null;
  paidAt: Date | null;
  createdAt: Date;
}

interface BillingDashboardViewProps {
  organizationName: string;
  quota: QuotaSummary;
  invoices: InvoiceItem[];
  midtransReady: boolean;
  highlightTier?: string;
  orderStatusResult?: InvoiceStatus | null;
}

export function BillingDashboardView({
  organizationName,
  quota,
  invoices,
  midtransReady,
  highlightTier,
  orderStatusResult,
}: BillingDashboardViewProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCheckout = (tier: PlanTier) => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await checkoutPlanAction(tier);
      if (res.success && res.redirectUrl) {
        window.location.href = res.redirectUrl;
      } else {
        setErrorMessage(res.error || "Gagal membuka gerbang pembayaran.");
      }
    });
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Paket & Tagihan</h1>
        <p className="text-sm text-muted-foreground">
          Kelola kuota pelamar AI, paket langganan, dan riwayat pembayaran untuk {organizationName}.
        </p>
      </div>

      {orderStatusResult && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
            orderStatusResult === "PAID"
              ? "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300"
              : orderStatusResult === "PENDING"
              ? "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300"
              : "bg-destructive/10 border-destructive/20 text-destructive"
          }`}
        >
          {orderStatusResult === "PAID" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : orderStatusResult === "PENDING" ? (
            <Clock className="w-5 h-5 shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 shrink-0" />
          )}
          <div>
            <span className="font-semibold">
              {orderStatusResult === "PAID"
                ? "Pembayaran Berhasil Diverifikasi!"
                : orderStatusResult === "PENDING"
                ? "Pembayaran Masih Menunggu Konfirmasi."
                : "Pembayaran Tidak Berhasil atau Dibatalkan."}
            </span>
            <p className="text-xs mt-0.5 opacity-90">
              {orderStatusResult === "PAID"
                ? "Kuota pelamar dan benefit paket telah langsung ditambahkan ke akun organisasi Anda."
                : orderStatusResult === "PENDING"
                ? "Selesaikan pembayaran melalui QRIS/VA yang telah dibuat. Status akan terupdate otomatis."
                : "Silakan coba lagi atau gunakan metode pembayaran lain."}
            </p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {!midtransReady && (
        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block text-sm">Mode Pengembangan / Kunci Pembayaran Belum Terpasang</span>
            <p className="mt-1 leading-relaxed">
              Variabel lingkungan <code className="bg-amber-500/20 px-1 py-0.5 rounded">MIDTRANS_SERVER_KEY</code> belum diisi di server. Checkout Midtrans dinonaktifkan sementara. Hubungi Super Admin atau administrator sistem.
            </p>
          </div>
        </div>
      )}

      {/* 1. Current Plan & Quota Card */}
      <Card className="rounded-2xl border bg-gradient-to-r from-card to-primary/5">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">Paket Aktif: {quota.planName}</CardTitle>
                <Badge variant={quota.planTier === "SME_PRO" ? "default" : "secondary"}>
                  {quota.planTier}
                </Badge>
              </div>
              <CardDescription className="text-xs mt-1">
                {quota.planTier === "SME_PRO" && quota.currentPeriodEnd
                  ? `Periode langganan aktif hingga ${new Date(quota.currentPeriodEnd).toLocaleDateString("id-ID")}`
                  : "Kuota dihitung berdasarkan jumlah kandidat yang memulai wawancara AI."}
              </CardDescription>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground block">Sisa Kuota Pelamar</span>
              <span className="text-2xl font-extrabold text-primary">{quota.remaining}</span>
              <span className="text-xs text-muted-foreground"> / {quota.total}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                quota.percentage >= 90 ? "bg-destructive" : "bg-primary"
              }`}
              style={{ width: `${quota.percentage}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>{quota.used} pelamar terpakai ({quota.percentage}%)</span>
            <span>{quota.remaining} pelamar tersisa</span>
          </div>
        </CardContent>
      </Card>

      {/* 2. Upgrade / Purchase Options */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Pilih atau Tambah Paket</h2>
          <p className="text-xs text-muted-foreground">
            Beli kredit tambahan kapan saja atau beralih ke paket langganan bulanan
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PLAN_ORDER.filter((t) => t !== "FREE").map((tier) => {
            const plan = PLANS[tier];
            const isTarget = highlightTier === plan.tier;

            return (
              <Card
                key={plan.tier}
                className={`rounded-2xl flex flex-col justify-between transition-all ${
                  isTarget ? "ring-2 ring-primary border-primary shadow-md" : ""
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{plan.name}</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      +{plan.applicantQuota} Pelamar
                    </Badge>
                  </div>
                  <CardDescription className="text-xs min-h-[32px]">
                    {plan.tagline}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="pb-4 border-b">
                    <span className="text-2xl font-extrabold tracking-tight">
                      {formatIdr(plan.price)}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      {plan.billing === "monthly" ? "/ bulan" : "/ pembayaran"}
                    </span>
                  </div>

                  <ul className="space-y-2 text-xs text-muted-foreground">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pt-2">
                  <Button
                    onClick={() => handleCheckout(plan.tier)}
                    disabled={isPending || !midtransReady}
                    className="w-full gap-2 text-xs"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Menyiapkan Midtrans...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-3.5 h-3.5" />
                        {plan.billing === "monthly" ? "Langganan Bulanan" : "Beli Kuota Sekarang"}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 3. Invoices History */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Riwayat Tagihan & Pembayaran ({invoices.length})
          </CardTitle>
          <CardDescription className="text-xs">
            Daftar seluruh invoice dan status transaksi yang diterbitkan via Midtrans.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              Belum ada transaksi pembayaran.
            </div>
          ) : (
            <div className="divide-y text-xs">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-semibold text-foreground flex items-center gap-2">
                      <span className="font-mono text-[11px]">{inv.orderId}</span>
                      <Badge
                        variant={
                          inv.status === "PAID"
                            ? "default"
                            : inv.status === "PENDING"
                            ? "secondary"
                            : "destructive"
                        }
                        className="text-[10px] py-0"
                      >
                        {inv.status}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground text-[11px] mt-0.5">
                      {inv.description} • Dibuat:{" "}
                      {new Date(inv.createdAt).toLocaleString("id-ID")}
                      {inv.paidAt && ` • Dibayar: ${new Date(inv.paidAt).toLocaleDateString("id-ID")}`}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span className="font-semibold text-foreground text-sm">
                      {formatIdr(inv.amount)}
                    </span>
                    {inv.status === "PENDING" && inv.snapRedirectUrl && (
                      <a
                        href={inv.snapRedirectUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-border hover:bg-muted font-medium"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Lanjut Bayar
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
