import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
            </nav>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Organisasi:</span>
            <span className="font-semibold text-foreground">ASE Lab</span>
          </div>
        </div>
      </header>
      <main className="container max-w-7xl mx-auto px-4 sm:px-8 py-6">{children}</main>
    </div>
  );
}
