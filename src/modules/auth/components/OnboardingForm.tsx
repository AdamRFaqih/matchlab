"use client";

import { useActionState } from "react";
import { Loader2, ArrowRight } from "lucide-react";
import { createOrganizationAction } from "@/modules/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function OnboardingForm() {
  const [state, formAction, isPending] = useActionState(createOrganizationAction, {});

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="p-3 text-xs rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
          {state.error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="name">Nama Organisasi / Startup / Lab</Label>
        <Input
          id="name"
          name="name"
          type="text"
          required
          placeholder="Contoh: ASE Research Lab / PT Nusantara Digital"
          disabled={isPending}
        />
        {state.fieldErrors?.name && (
          <p className="text-xs text-destructive">{state.fieldErrors.name}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cultureDescription">
          Deskripsi Kultur & Profil Tim{" "}
          <span className="text-muted-foreground font-normal">(Opsional)</span>
        </Label>
        <Textarea
          id="cultureDescription"
          name="cultureDescription"
          rows={3}
          placeholder="Contoh: Tim kami fokus pada kerja mandiri, transparansi, ketelitian tinggi dalam sistem terdistribusi, dan komunikasi terbuka."
          disabled={isPending}
        />
        <p className="text-[11px] text-muted-foreground">
          AI Interviewer & Evaluator menggunakan deskripsi kultur ini untuk menguji kecocokan perilaku implisit kandidat.
        </p>
      </div>

      <Button type="submit" className="w-full gap-2 pt-2" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Membuat Organisasi...
          </>
        ) : (
          <>
            Mulai Gunakan MatchLab
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </Button>
    </form>
  );
}
