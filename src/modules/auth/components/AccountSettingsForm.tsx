"use client";

import { useActionState, useTransition } from "react";
import { Loader2, KeyRound, User, AlertTriangle, ShieldCheck } from "lucide-react";
import {
  updateAccountProfileAction,
  changePasswordAction,
  signOutOtherSessionsAction,
  deleteAccountAction,
} from "@/modules/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AccountProfileForm({ initialName }: { initialName: string }) {
  const [state, formAction, isPending] = useActionState(updateAccountProfileAction, {});

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
        <Label htmlFor="name">Nama Lengkap</Label>
        <Input
          id="name"
          name="name"
          defaultValue={initialName}
          required
          disabled={isPending}
        />
        {state.fieldErrors?.name && (
          <p className="text-xs text-destructive">{state.fieldErrors.name}</p>
        )}
      </div>

      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <User className="w-3.5 h-3.5 mr-1" />}
        Simpan Profil
      </Button>
    </form>
  );
}

export function AccountPasswordForm() {
  const [state, formAction, isPending] = useActionState(changePasswordAction, {});

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
        <Label htmlFor="currentPassword">Password Saat Ini</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          disabled={isPending}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="newPassword">Password Baru</Label>
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            required
            autoComplete="new-password"
            disabled={isPending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            disabled={isPending}
          />
        </div>
      </div>

      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <KeyRound className="w-3.5 h-3.5 mr-1" />}
        Ubah Password
      </Button>
    </form>
  );
}

export function SignOutOtherSessionsButton({ count }: { count: number }) {
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    if (confirm("Keluarkan seluruh sesi lain di browser dan perangkat lain?")) {
      startTransition(async () => {
        await signOutOtherSessionsAction();
        window.location.reload();
      });
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleSignOut}
      disabled={isPending || count <= 1}
    >
      {isPending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
      ) : (
        <ShieldCheck className="w-3.5 h-3.5 mr-1 text-primary" />
      )}
      Keluarkan Sesi di Perangkat Lain
    </Button>
  );
}

export function DeleteAccountForm({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const [state, formAction, isPending] = useActionState(deleteAccountAction, {});

  if (isSuperAdmin) {
    return (
      <p className="text-xs text-muted-foreground">
        Akun platform Super Admin dilindungi dan tidak dapat dihapus dari halaman ini.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      {state.error && (
        <div className="p-3 text-xs rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
          {state.error}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Menghapus akun akan menghapus profil Anda secara permanen. Jika Anda adalah satu-satunya admin di suatu organisasi, organisasi tersebut juga akan dihapus.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="confirm" className="text-xs">
            Ketik &quot;HAPUS&quot; untuk konfirmasi
          </Label>
          <Input id="confirm" name="confirm" placeholder="HAPUS" required disabled={isPending} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="delPassword" className="text-xs">
            Password Akun Anda
          </Label>
          <Input
            id="delPassword"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            disabled={isPending}
          />
        </div>
      </div>

      <Button type="submit" variant="destructive" size="sm" disabled={isPending}>
        {isPending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
        ) : (
          <AlertTriangle className="w-3.5 h-3.5 mr-1" />
        )}
        Hapus Akun Saya Selamanya
      </Button>
    </form>
  );
}
