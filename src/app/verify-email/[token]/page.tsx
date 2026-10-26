import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, XCircle, Sparkles, ArrowRight } from "lucide-react";
import { verifyEmailToken } from "@/modules/auth/service";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Konfirmasi Verifikasi Email",
};

export default async function VerifyEmailTokenPage(props: {
  params: Promise<{ token: string }>;
}) {
  const params = await props.params;
  const success = await verifyEmailToken(params.token);

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-muted/20">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl tracking-tight mb-4">
          <span className="p-2 rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Sparkles className="w-5 h-5" />
          </span>
          <span>MatchLab</span>
        </Link>
      </div>

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card border py-8 px-6 shadow-xs rounded-2xl sm:px-8 text-center space-y-4">
          {success ? (
            <>
              <div className="mx-auto w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Email Berhasil Diverifikasi!
              </h2>
              <p className="text-sm text-muted-foreground">
                Akun Anda telah aktif sepenuhnya. Anda sekarang dapat mengakses seluruh fitur MatchLab.
              </p>
              <div className="pt-2">
                <Link href="/login" className={buttonVariants({ className: "w-full gap-2" })}>
                  Lanjut ke Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                <XCircle className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Tautan Tidak Valid atau Kedaluwarsa
              </h2>
              <p className="text-sm text-muted-foreground">
                Tautan verifikasi ini sudah pernah digunakan atau batas waktu 24 jam telah berakhir.
              </p>
              <div className="pt-2">
                <Link href="/verify-email" className={buttonVariants({ variant: "outline", className: "w-full" })}>
                  Kirim Ulang Tautan Verifikasi
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
