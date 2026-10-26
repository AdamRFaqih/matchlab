import Link from "next/link";
import { Sparkles, Shield } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { RoleSwitcher } from "@/components/auth/RoleSwitcher";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await getSession();
  const orgName = sessionUser?.memberships[0]?.organizationName || "ASE Research Lab";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-7xl items-center justify-between px-4 sm:px-8 mx-auto">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg">
              <span className="bg-primary text-primary-foreground p-1 rounded-md">
                <Sparkles className="w-4 h-4" />
              </span>
              MatchLab
            </Link>
            <nav className="flex items-center gap-4 text-sm font-medium">
              <Link
                href="/dashboard/jobs/new"
                className="text-foreground hover:text-foreground/80 transition-colors"
              >
                Buat Lowongan
              </Link>
              <Link
                href="/super-admin"
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <Shield className="w-3.5 h-3.5" />
                Super Admin
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <span>Organisasi:</span>
              <span className="font-semibold text-foreground">{orgName}</span>
            </div>
            <RoleSwitcher currentUser={sessionUser} />
          </div>
        </div>
      </header>
      <main className="container max-w-7xl mx-auto px-4 sm:px-8 py-6">{children}</main>
    </div>
  );
}
