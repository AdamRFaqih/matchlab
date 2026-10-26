import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { RoleSwitcher } from "@/components/auth/RoleSwitcher";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await getSession();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-7xl mx-auto flex h-14 items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/super-admin"
              className="flex items-center gap-2 font-bold text-base tracking-tight"
            >
              <span className="p-1.5 rounded-lg bg-purple-600 text-white shadow-xs">
                <Shield className="w-4 h-4" />
              </span>
              <span>MatchLab Super Admin</span>
            </Link>
            <div className="hidden sm:inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 font-medium">
              SaaS Control Panel
            </div>
          </div>

          <div className="flex items-center gap-3">
            <RoleSwitcher currentUser={sessionUser} />
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Kembali ke Aplikasi
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
