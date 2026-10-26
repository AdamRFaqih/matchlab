"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2, ArrowRight } from "lucide-react";
import { loginAction } from "@/modules/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LoginFormProps {
  nextPath?: string;
  resetSuccess?: boolean;
}

export function LoginForm({ nextPath, resetSuccess }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(loginAction, {});

  return (
    <form action={formAction} className="space-y-4">
      {resetSuccess && (
        <div className="p-3 text-xs rounded-lg bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-300">
          Password berhasil diubah. Silakan masuk dengan password baru Anda.
        </div>
      )}

      {state.error && (
        <div className="p-3 text-xs rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
          {state.error}
        </div>
      )}

      {nextPath && <input type="hidden" name="next" value={nextPath} />}

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="nama@email.com"
          disabled={isPending}
        />
        {state.fieldErrors?.email && (
          <p className="text-xs text-destructive">{state.fieldErrors.email}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/forgot-password"
            className="text-xs text-primary hover:underline"
            tabIndex={-1}
          >
            Lupa password?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          disabled={isPending}
        />
        {state.fieldErrors?.password && (
          <p className="text-xs text-destructive">{state.fieldErrors.password}</p>
        )}
      </div>

      <Button type="submit" className="w-full gap-2" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Memproses...
          </>
        ) : (
          <>
            Masuk
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </Button>
    </form>
  );
}
