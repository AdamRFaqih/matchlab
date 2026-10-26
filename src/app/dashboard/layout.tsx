import Link from "next/link";
import {
  Sparkles,
  Briefcase,
  Plus,
  Settings,
  Users,
  CreditCard,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { requireOrgMember } from "@/lib/auth/guards";
import { getQuotaSummary } from "@/lib/billing/quota";
import { db } from "@/lib/db";
import { UserMenu } from "@/components/auth/UserMenu";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireOrgMember();
  const quota = await getQuotaSummary(ctx.organizationId);

  const org = await db.organization.findUnique({
    where: { id: ctx.organizationId },
    select: { name: true, isSuspended: true },
  });

  const orgName = org?.name || ctx.user.activeOrgName || "Organisasi";
  const isSuspended = Boolean(org?.isSuspended);
  const isLowQuota = quota && quota.remaining <= 5;
  const isExpired = quota?.isExpired;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8 mx-auto">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
              <span className="bg-primary text-primary-foreground p-1.5 rounded-lg shadow-xs">
                <Sparkles className="w-4 h-4" />
              </span>
              <span>MatchLab</span>
            </Link>
            <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
              <Link
                href="/dashboard"
                className="text-foreground hover:text-foreground/80 transition-colors flex items-center gap-1.5"
              >
                <Briefcase className="w-4 h-4" />
                Lowongan Tim
              </Link>
              <Link
                href="/dashboard/jobs/new"
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Buat Lowongan
              </Link>
              {ctx.isOrgAdmin && (
                <>
                  <Link
                    href="/dashboard/team"
                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                  >
                    <Users className="w-4 h-4" />
                    Tim
                  </Link>
                  <Link
                    href="/dashboard/billing"
                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                  >
                    <CreditCard className="w-4 h-4" />
                    Paket & Tagihan
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                  >
                    <Settings className="w-4 h-4" />
                    Pengaturan
                  </Link>
                </>
              )}
              <Link
                href="/jobs"
                className="text-muted-foreground hover:text-foreground transition-colors text-xs"
              >
                Bursa Publik ↗
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border">
              <span>Organisasi:</span>
              <span className="font-semibold text-foreground max-w-[120px] truncate">{orgName}</span>
            </div>
            <UserMenu user={ctx.user} />
          </div>
        </div>
      </header>

      {/* Quota / Status Notification Banners */}
      {isSuspended && (
        <div className="bg-destructive text-destructive-foreground px-4 py-2.5 text-xs text-center font-medium flex items-center justify-center gap-2">
          <ShieldAlert className="w-4 h-4" />
          <span>Organisasi ini sedang ditangguhkan. Hubungi support untuk memulihkan akses penerimaan pelamar.</span>
        </div>
      )}

      {!isSuspended && isExpired && (
        <div className="bg-amber-500 text-amber-950 px-4 py-2 text-xs text-center font-medium flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>Masa langganan SME Pro Anda telah berakhir. Sistem telah beralih ke batas paket Free.</span>
          {ctx.isOrgAdmin && (
            <Link href="/dashboard/billing" className="underline font-bold inline-flex items-center gap-0.5 ml-1">
              Perpanjang Sekarang <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      )}

      {!isSuspended && !isExpired && isLowQuota && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-900 dark:text-amber-200 px-4 py-2 text-xs text-center font-medium flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            {quota.remaining === 0
              ? "Kuota pelamar Anda telah habis! Lowongan Anda tidak dapat menerima pelamar baru."
              : `Sisa kuota pelamar organisasi Anda tersisa ${quota.remaining}. Segera tambah kuota.`}
          </span>
          {ctx.isOrgAdmin && (
            <Link href="/dashboard/billing" className="underline font-bold inline-flex items-center gap-0.5 ml-1">
              Beli Kuota <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      )}

      <main className="flex-1 container max-w-7xl mx-auto px-4 sm:px-8 py-8">{children}</main>
    </div>
  );
}
