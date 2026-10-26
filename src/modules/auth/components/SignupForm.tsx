"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Loader2, ArrowRight, User, Building2 } from "lucide-react";
import { signupAction } from "@/modules/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SignupFormProps {
  initialType?: "JOB_SEEKER" | "COMPANY_USER";
  inviteToken?: string;
  inviteEmail?: string;
  nextPath?: string;
}

export function SignupForm({
  initialType = "JOB_SEEKER",
  inviteToken,
  inviteEmail,
  nextPath,
}: SignupFormProps) {
  const [accountType, setAccountType] = useState<"JOB_SEEKER" | "COMPANY_USER">(
    inviteToken ? "COMPANY_USER" : initialType
  );
  const [state, formAction, isPending] = useActionState(signupAction, {});

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="p-3 text-xs rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
          {state.error}
        </div>
      )}

      {nextPath && <input type="hidden" name="next" value={nextPath} />}
      {inviteToken && <input type="hidden" name="inviteToken" value={inviteToken} />}
      <input type="hidden" name="accountType" value={accountType} />

      {!inviteToken && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Tipe Akun</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAccountType("JOB_SEEKER")}
              className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                accountType === "JOB_SEEKER"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:bg-muted/50 text-muted-foreground"
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                <User className="w-3.5 h-3.5 text-primary" />
                Pencari Kerja
              </div>
              <span className="text-[11px] leading-tight">Melamar & wawancara AI</span>
            </button>

            <button
              type="button"
              onClick={() => setAccountType("COMPANY_USER")}
              className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                accountType === "COMPANY_USER"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:bg-muted/50 text-muted-foreground"
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                Perekrut / Tim
              </div>
              <span className="text-[11px] leading-tight">Buat lowongan & seleksi</span>
            </button>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="name">Nama Lengkap</Label>
        <Input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          placeholder="Nama Anda"
          disabled={isPending}
        />
        {state.fieldErrors?.name && (
          <p className="text-xs text-destructive">{state.fieldErrors.name}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Alamat Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={inviteEmail || ""}
          readOnly={Boolean(inviteEmail)}
          required
          placeholder="nama@email.com"
          disabled={isPending}
          className={inviteEmail ? "bg-muted" : ""}
        />
        {state.fieldErrors?.email && (
          <p className="text-xs text-destructive">{state.fieldErrors.email}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          placeholder="Minimal 8 karakter (huruf & angka)"
          disabled={isPending}
        />
        {state.fieldErrors?.password && (
          <p className="text-xs text-destructive">{state.fieldErrors.password}</p>
        )}
      </div>

      <div className="flex items-start gap-2 pt-1">
        <input
          id="acceptTerms"
          name="acceptTerms"
          type="checkbox"
          required
          className="mt-1 size-4 rounded border-border text-primary focus:ring-primary/20"
          disabled={isPending}
        />
        <Label htmlFor="acceptTerms" className="text-xs text-muted-foreground font-normal leading-normal">
          Saya menyetujui{" "}
          <Link href="/terms" target="_blank" className="text-primary hover:underline">
            Syarat & Ketentuan
          </Link>{" "}
          dan{" "}
          <Link href="/privacy" target="_blank" className="text-primary hover:underline">
            Kebijakan Privasi
          </Link>{" "}
          MatchLab.
        </Label>
      </div>
      {state.fieldErrors?.acceptTerms && (
        <p className="text-xs text-destructive">{state.fieldErrors.acceptTerms}</p>
      )}

      <Button type="submit" className="w-full gap-2" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Mendaftarkan...
          </>
        ) : (
          <>
            Daftar Sekarang
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </Button>
    </form>
  );
}
