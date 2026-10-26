"use client";

import { useActionState } from "react";
import { Loader2, ArrowRight } from "lucide-react";
import { acceptInvitationAction } from "@/modules/auth/actions";
import { Button } from "@/components/ui/button";

export function AcceptInviteForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState(acceptInvitationAction, {});

  return (
    <form action={formAction} className="space-y-3">
      {state.error && (
        <div className="p-3 text-xs rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-left">
          {state.error}
        </div>
      )}
      <input type="hidden" name="token" value={token} />
      <Button type="submit" className="w-full gap-2" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Menerima Undangan...
          </>
        ) : (
          <>
            Terima Undangan & Masuk ke Tim
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </Button>
    </form>
  );
}
