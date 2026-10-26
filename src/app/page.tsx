import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-background text-foreground">
      <main className="max-w-2xl text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-muted/50 text-xs font-medium text-muted-foreground mb-2">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          AI-Powered Talent Matchmaker & Early Screening
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          MatchLab
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Platform penyaringan awal dua arah berbasis wawancara AI. Ubah deskripsi kebutuhan santai Lab Lead
          menjadi rubrik penilaian objektif dan uji kandidat dengan skenario situasional nyata.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <Link
            href="/dashboard/jobs/new"
            className={cn(buttonVariants({ size: "lg" }), "font-semibold")}
          >
            Mulai Buat Lowongan (Flow A)
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Link>
          <Link
            href="/super-admin"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "font-semibold")}
          >
            Super Admin Control Panel
          </Link>
        </div>
      </main>
    </div>
  );
}
