import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Mail, Sparkles } from "lucide-react";
import { requireUser, homePathFor } from "@/lib/auth/guards";
import { VerifyEmailForm } from "@/modules/auth/components/VerifyEmailForm";

export const metadata: Metadata = {
  title: "Verifikasi Email",
  description: "Verifikasi alamat email akun MatchLab Anda.",
};

export default async function VerifyEmailPage(props: {
  searchParams: Promise<{ next?: string }>;
}) {
  const searchParams = await props.searchParams;
  const user = await requireUser("/verify-email");

  if (user.emailVerified) {
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
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary my-3">
          <Mail className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Verifikasi Email Anda
        </h2>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card border py-8 px-6 shadow-xs rounded-2xl sm:px-8">
          <VerifyEmailForm email={user.email} />

          <div className="mt-6 pt-4 border-t text-center">
            <Link
              href="/login"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Ganti akun / Masuk kembali
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
