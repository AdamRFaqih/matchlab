import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { homePathFor } from "@/lib/auth/guards";
import { LoginForm } from "@/modules/auth/components/LoginForm";

export const metadata: Metadata = {
  title: "Masuk ke Akun",
  description: "Masuk ke MatchLab untuk mengelola lowongan atau melamar pekerjaan.",
};

export default async function LoginPage(props: {
  searchParams: Promise<{ next?: string; reset?: string }>;
}) {
  const searchParams = await props.searchParams;
  const user = await getSession();

  if (user) {
    redirect(searchParams.next || homePathFor(user));
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-muted/20">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl tracking-tight mb-2">
          <span className="p-2 rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Sparkles className="w-5 h-5" />
          </span>
          <span>MatchLab</span>
        </Link>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Masuk ke Akun Anda
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Belum punya akun?{" "}
          <Link
            href={`/signup${searchParams.next ? `?next=${encodeURIComponent(searchParams.next)}` : ""}`}
            className="font-semibold text-primary hover:underline"
          >
            Daftar gratis
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card border py-8 px-6 shadow-xs rounded-2xl sm:px-8">
          <LoginForm
            nextPath={searchParams.next}
            resetSuccess={Boolean(searchParams.reset)}
          />
        </div>
      </div>
    </div>
  );
}
