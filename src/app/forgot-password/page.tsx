import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { ForgotPasswordForm } from "@/modules/auth/components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Lupa Password",
  description: "Atur ulang password akun MatchLab Anda.",
};

export default function ForgotPasswordPage() {
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
          Atur Ulang Password
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Masukkan alamat email yang terdaftar untuk menerima instruksi reset.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card border py-8 px-6 shadow-xs rounded-2xl sm:px-8">
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
