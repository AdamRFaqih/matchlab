import Link from "next/link";
import { Sparkles, Briefcase, User, FileText } from "lucide-react";
import { requireJobSeeker } from "@/lib/auth/guards";
import { UserMenu } from "@/components/auth/UserMenu";

export default async function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await requireJobSeeker("/candidate/dashboard");

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
              <span className="bg-primary text-primary-foreground p-1.5 rounded-lg shadow-xs">
                <Sparkles className="w-4 h-4" />
              </span>
              <span>MatchLab</span>
            </Link>
            <nav className="hidden sm:flex items-center gap-4 text-sm font-medium">
              <Link
                href="/candidate/dashboard"
                className="text-foreground font-semibold hover:text-foreground/80 transition-colors flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                Dashboard Lamaran
              </Link>
              <Link
                href="/candidate/profile"
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
              >
                <User className="w-4 h-4" />
                Profil & CV
              </Link>
              <Link
                href="/jobs"
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 text-xs"
              >
                <Briefcase className="w-3.5 h-3.5" />
                Bursa Lowongan ↗
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <UserMenu user={sessionUser} />
          </div>
        </div>
      </header>

      <main className="flex-1 container max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        {children}
      </main>
    </div>
  );
}
