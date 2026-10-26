"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, Send } from "lucide-react";
import { forgotPasswordAction } from "@/modules/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(forgotPasswordAction, {});

  return (
    <form action={formAction} className="space-y-4">
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

      <div className="space-y-1.5">
        <Label htmlFor="email">Email Akun Anda</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="nama@email.com"
          disabled={isPending}
        />
      </div>

      <Button type="submit" className="w-full gap-2" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Mengirim instruksi...
          </>
        ) : (
          <>
            Kirim Tautan Reset
            <Send className="w-4 h-4" />
          </>
        )}
      </Button>

      <div className="text-center pt-2">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke halaman Masuk
        </Link>
      </div>
    </form>
  );
}
