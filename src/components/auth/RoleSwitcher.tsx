"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserCog, Check, Loader2 } from "lucide-react";
import { DEMO_ROLES, type AuthUser } from "@/lib/auth/types";
import { switchSessionUserAction } from "@/lib/auth/actions";

interface RoleSwitcherProps {
  currentUser: AuthUser | null;
}

export function RoleSwitcher({ currentUser }: RoleSwitcherProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSelectRole = (email: string) => {
    startTransition(async () => {
      await switchSessionUserAction(email);
      setIsOpen(false);
      router.refresh();
    });
  };

  const currentRoleLabel =
    DEMO_ROLES.find((r) => r.email === currentUser?.email)?.label ||
    currentUser?.name ||
    "Pilih Peran";

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border bg-background/80 hover:bg-muted text-xs font-medium text-foreground shadow-xs transition-colors"
      >
        <UserCog className="w-3.5 h-3.5 text-primary" />
        <span className="hidden sm:inline text-muted-foreground">Aktif sebagai:</span>
        <span className="font-semibold text-primary">{currentRoleLabel}</span>
        {isPending && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-xl border bg-card p-2 text-card-foreground shadow-lg ring-1 ring-black/5 z-50">
            <div className="px-2 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b mb-1">
              Simulasi Ganti Peran (RBAC)
            </div>
            <div className="space-y-1">
              {DEMO_ROLES.map((role) => {
                const isSelected = currentUser?.email === role.email;
                return (
                  <button
                    key={role.email}
                    onClick={() => handleSelectRole(role.email)}
                    disabled={isPending}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors flex items-start justify-between ${
                      isSelected
                        ? "bg-primary/10 text-primary font-semibold"
                        : "hover:bg-muted text-foreground"
                    }`}
                  >
                    <div>
                      <div className="font-medium leading-none">{role.label}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {role.description}
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
