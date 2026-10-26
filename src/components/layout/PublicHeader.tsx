import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { UserMenu } from "@/components/auth/UserMenu";

export async function PublicHeader() {
  const user = await getSession();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <span className="p-1.5 rounded-lg bg-primary text-primary-foreground shadow-xs">
              <Sparkles className="w-4 h-4" />
            </span>
            <span>MatchLab</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link
              href="/jobs"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Bursa Lowongan
            </Link>
            <Link
              href="/pricing"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Harga & Paket
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
