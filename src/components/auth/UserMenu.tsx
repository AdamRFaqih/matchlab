"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Check,
  ChevronDown,
  CreditCard,
  LayoutDashboard,
  Loader2,
  LogOut,
  Shield,
  User as UserIcon,
  Users,
} from "lucide-react";
import type { AuthUser } from "@/lib/auth/types";
import { logoutAction, switchOrganizationAction } from "@/modules/auth/actions";

interface UserMenuProps {
  user: AuthUser | null;
}

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ORG_ADMIN: "Org Admin",
  DIVISION_LEAD: "Division Lead",
  JOB_SEEKER: "Pencari Kerja",
  COMPANY_USER: "Akun Organisasi",
};

/**
 * Account dropdown shown in every authenticated header: identity, organization switcher,
 * shortcuts and sign out. Renders Login / Sign up buttons when signed out.
 */
export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="text-sm font-medium text-muted-foreground hover:text-foreground px-2 py-1.5"
        >
          Masuk
        </Link>
        <Link
          href="/signup"
          className="text-sm font-medium rounded-lg bg-primary text-primary-foreground px-3 py-1.5 hover:bg-primary/85"
        >
          Daftar Gratis
        </Link>
      </div>
    );
  }

  const roleLabel =
    user.systemRole === "COMPANY_USER" && user.activeOrgRole
      ? ROLE_LABEL[user.activeOrgRole]
      : ROLE_LABEL[user.systemRole];

  const initials = user.name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const switchOrg = (orgId: string) => {
    startTransition(async () => {
      const res = await switchOrganizationAction(orgId);
      if (res.success) {
        setOpen(false);
        router.push("/dashboard");
        router.refresh();
      }
    });
  };

  const isCompany = user.systemRole === "COMPANY_USER";
  const isOrgAdmin = user.activeOrgRole === "ORG_ADMIN";

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border bg-background hover:bg-muted text-xs font-medium shadow-xs transition-colors"
      >
        <span className="inline-flex items-center justify-center size-7 rounded-full bg-primary text-primary-foreground text-[11px] font-bold">
          {initials || <UserIcon className="size-3.5" />}
        </span>
        <span className="hidden sm:flex flex-col items-start leading-tight">
          <span className="font-semibold text-foreground max-w-[140px] truncate">{user.name}</span>
          <span className="text-[10px] text-muted-foreground">{roleLabel}</span>
        </span>
        {pending ? (
          <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
        ) : (
          <ChevronDown className="size-3.5 text-muted-foreground" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            role="menu"
            className="absolute right-0 mt-2 w-72 origin-top-right rounded-xl border bg-card p-1.5 text-card-foreground shadow-lg z-50"
          >
            <div className="px-3 py-2 border-b mb-1">
              <div className="text-sm font-semibold truncate">{user.name}</div>
              <div className="text-xs text-muted-foreground truncate">{user.email}</div>
            </div>

            {isCompany && user.memberships.length > 0 && (
              <div className="py-1 border-b mb-1">
                <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Organisasi
                </div>
                {user.memberships.map((m) => (
                  <button
                    key={m.organizationId}
                    type="button"
                    disabled={pending}
                    onClick={() => switchOrg(m.organizationId)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-xs hover:bg-muted text-left"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <Building2 className="size-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{m.organizationName}</span>
                    </span>
                    {m.organizationId === user.activeOrgId && <Check className="size-3.5 text-primary" />}
                  </button>
                ))}
                <Link
                  href="/onboarding"
                  onClick={() => setOpen(false)}
                  className="block px-3 py-1.5 rounded-lg text-xs text-primary hover:bg-muted"
                >
                  + Buat organisasi baru
                </Link>
              </div>
            )}

            <MenuLink href={homeHref(user)} icon={<LayoutDashboard className="size-3.5" />} onNavigate={() => setOpen(false)}>
              Dashboard
            </MenuLink>
            {isCompany && isOrgAdmin && (
              <>
                <MenuLink href="/dashboard/team" icon={<Users className="size-3.5" />} onNavigate={() => setOpen(false)}>
                  Tim & Undangan
                </MenuLink>
                <MenuLink href="/dashboard/billing" icon={<CreditCard className="size-3.5" />} onNavigate={() => setOpen(false)}>
                  Paket & Tagihan
                </MenuLink>
              </>
            )}
            {user.systemRole === "SUPER_ADMIN" && (
              <MenuLink href="/super-admin" icon={<Shield className="size-3.5" />} onNavigate={() => setOpen(false)}>
                Super Admin
              </MenuLink>
            )}
            <MenuLink href="/account" icon={<UserIcon className="size-3.5" />} onNavigate={() => setOpen(false)}>
              Pengaturan Akun
            </MenuLink>

            <form action={logoutAction} className="border-t mt-1 pt-1">
              <button
                type="submit"
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-destructive hover:bg-destructive/10"
              >
                <LogOut className="size-3.5" />
                Keluar
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

function homeHref(user: AuthUser) {
  if (user.systemRole === "SUPER_ADMIN") return "/super-admin";
  if (user.systemRole === "JOB_SEEKER") return "/candidate/dashboard";
  return user.memberships.length ? "/dashboard" : "/onboarding";
}

function MenuLink({
  href,
  icon,
  children,
  onNavigate,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      role="menuitem"
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs hover:bg-muted"
    >
      <span className="text-muted-foreground">{icon}</span>
      {children}
    </Link>
  );
}
