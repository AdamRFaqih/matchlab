import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, XCircle } from "lucide-react";
import { isPasswordResetTokenValid } from "@/modules/auth/service";
import { ResetPasswordForm } from "@/modules/auth/components/ResetPasswordForm";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Password Baru",
};

export default async function ResetPasswordPage(props: {
  params: Promise<{ token: string }>;
}) {
  const params = await props.params;
  const isValid = await isPasswordResetTokenValid(params.token);

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
          Buat Password Baru
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card border py-8 px-6 shadow-xs rounded-2xl sm:px-8">
          {isValid ? (
            <ResetPasswordForm token={params.token} />
          ) : (
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                <XCircle className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-foreground">Tautan Tidak Berlaku</h3>
              <p className="text-xs text-muted-foreground">
                Tautan atur ulang password ini tidak valid atau sudah kedaluwarsa (berlaku 1 jam).
              </p>
              <Link href="/forgot-password" className={buttonVariants({ variant: "outline", className: "w-full" })}>
                Minta Tautan Baru
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
