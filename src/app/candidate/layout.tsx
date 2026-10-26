import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { RoleSwitcher } from "@/components/auth/RoleSwitcher";

export default async function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await getSession();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-7xl mx-auto flex h-14 items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg">
              <span className="bg-primary text-primary-foreground p-1 rounded-md">
                <Sparkles className="w-4 h-4" />
              </span>
              MatchLab
            </Link>
            <nav className="flex items-center gap-4 text-sm font-medium">
              <Link
                href="/candidate/dashboard"
                className="text-foreground font-semibold hover:text-foreground/80 transition-colors"
              >
                Dashboard Lamaran
              </Link>
              <Link
                href="/candidate/profile"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Profil & CV
              </Link>
              <Link
                href="/jobs"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Bursa Lowongan
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <RoleSwitcher currentUser={sessionUser} />
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Beranda
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 container max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        {children}
      </main>
    </div>
  );
}
