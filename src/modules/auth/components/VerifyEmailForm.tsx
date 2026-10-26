"use client";

import { useActionState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { resendVerificationAction } from "@/modules/auth/actions";
import { Button } from "@/components/ui/button";

interface VerifyEmailFormProps {
  email: string;
}

export function VerifyEmailForm({ email }: VerifyEmailFormProps) {
  const [state, formAction, isPending] = useActionState(resendVerificationAction, {});

  return (
    <form action={formAction} className="space-y-4 text-center">
      <p className="text-sm text-muted-foreground">
        Kami telah mengirimkan tautan verifikasi ke{" "}
        <span className="font-semibold text-foreground">{email}</span>. Silakan periksa kotak masuk atau folder spam Anda.
      </p>

      {state.message && (
        <div className="p-3 text-xs rounded-lg bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-300">
          {state.message}
        </div>
      )}

      {state.error && (
        <div className="p-3 text-xs rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
          {state.error}
        </div>
      )}

      <Button type="submit" variant="outline" className="gap-2" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Mengirim ulang...
          </>
        ) : (
          <>
            <RefreshCw className="w-3.5 h-3.5" />
            Kirim Ulang Email Verifikasi
          </>
        )}
      </Button>
    </form>
  );
}
