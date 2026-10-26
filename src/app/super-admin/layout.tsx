import Link from "next/link";
import { Shield, LayoutDashboard, CreditCard, ScrollText, ArrowLeft } from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { UserMenu } from "@/components/auth/UserMenu";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await requireSuperAdmin();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-6">
            <Link
              href="/super-admin"
              className="flex items-center gap-2 font-bold text-base tracking-tight"
            >
              <span className="p-1.5 rounded-lg bg-purple-600 text-white shadow-xs">
                <Shield className="w-4 h-4" />
              </span>
              <span>MatchLab Control Panel</span>
            </Link>

            <nav className="hidden md:flex items-center gap-4 text-xs font-medium">
              <Link
                href="/super-admin"
                className="text-foreground hover:text-foreground/80 transition-colors flex items-center gap-1.5"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Ringkasan
              </Link>
              <Link
                href="/super-admin/billing"
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" />
                Semua Pembayaran
              </Link>
              <Link
                href="/super-admin/audit"
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
              >
                <ScrollText className="w-3.5 h-3.5" />
                Audit Log
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <UserMenu user={sessionUser} />
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Ke Beranda
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 container max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {children}
      </main>
    </div>
  );
}
