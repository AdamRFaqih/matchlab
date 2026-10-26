import type { Metadata } from "next";
import Link from "next/link";
import { CreditCard, ArrowLeft } from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { formatIdr } from "@/lib/billing/plans";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Semua Pembayaran & Invoice",
  description: "Pengawasan transaksi Midtrans lintas organisasi.",
};

export default async function SuperAdminBillingPage(props: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireSuperAdmin();
  const searchParams = await props.searchParams;

  const statusFilter = searchParams.status;

  const invoices = await db.invoice.findMany({
    where: statusFilter && statusFilter !== "ALL" ? { status: statusFilter as never } : undefined,
    include: {
      organization: {
        select: { id: true, name: true, slug: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const totalPaid = await db.invoice.aggregate({
    where: { status: "PAID" },
    _sum: { amount: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/super-admin"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Kembali ke Ringkasan
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-1 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-purple-600" />
            Pengawasan Pembayaran & Invoice Midtrans
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Total omzet transaksi sukses tercatat:{" "}
            <span className="font-bold text-emerald-600">
              {formatIdr(totalPaid._sum.amount || 0)}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg text-xs">
          <Link
            href="/super-admin/billing"
            className={`px-2.5 py-1 rounded-md font-medium ${
              !statusFilter || statusFilter === "ALL" ? "bg-background shadow-xs font-semibold" : "text-muted-foreground"
            }`}
          >
            Semua
          </Link>
          <Link
            href="/super-admin/billing?status=PAID"
            className={`px-2.5 py-1 rounded-md font-medium ${
              statusFilter === "PAID" ? "bg-background shadow-xs font-semibold text-emerald-600" : "text-muted-foreground"
            }`}
          >
            PAID
          </Link>
          <Link
            href="/super-admin/billing?status=PENDING"
            className={`px-2.5 py-1 rounded-md font-medium ${
              statusFilter === "PENDING" ? "bg-background shadow-xs font-semibold text-amber-600" : "text-muted-foreground"
            }`}
          >
            PENDING
          </Link>
          <Link
            href="/super-admin/billing?status=FAILED"
            className={`px-2.5 py-1 rounded-md font-medium ${
              statusFilter === "FAILED" ? "bg-background shadow-xs font-semibold text-destructive" : "text-muted-foreground"
            }`}
          >
            FAILED
          </Link>
        </div>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Daftar Transaksi ({invoices.length})</CardTitle>
          <CardDescription className="text-xs">
            Menampilkan hingga 100 transaksi terakhir yang diterbitkan di platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b bg-muted/30 font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-4">Order ID & Tanggal</th>
                  <th className="py-3 px-4">Organisasi</th>
                  <th className="py-3 px-4">Paket / Deskripsi</th>
                  <th className="py-3 px-4">Jumlah (IDR)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Waktu Dibayar</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      Belum ada invoice yang sesuai dengan filter.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 align-top">
                        <div className="font-mono font-semibold">{inv.orderId}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {new Date(inv.createdAt).toLocaleString("id-ID")}
                        </div>
                      </td>

                      <td className="py-3 px-4 align-top">
                        <div className="font-medium text-foreground">{inv.organization.name}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          /{inv.organization.slug}
                        </div>
                      </td>

                      <td className="py-3 px-4 align-top">
                        <div className="font-medium">{inv.description}</div>
                        <Badge variant="outline" className="text-[10px] py-0 mt-0.5">
                          {inv.plan}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 align-top font-semibold text-foreground">
                        {formatIdr(inv.amount)}
                      </td>

                      <td className="py-3 px-4 align-top">
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
                      </td>

                      <td className="py-3 px-4 align-top text-muted-foreground">
                        {inv.paidAt ? new Date(inv.paidAt).toLocaleString("id-ID") : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
