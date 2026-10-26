import type { Metadata } from "next";
import { Laptop, Smartphone, Shield, KeyRound, AlertTriangle, User } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import {
  AccountProfileForm,
  AccountPasswordForm,
  SignOutOtherSessionsButton,
  DeleteAccountForm,
} from "@/modules/auth/components/AccountSettingsForm";

export const metadata: Metadata = {
  title: "Pengaturan Akun",
  description: "Kelola profil, keamanan, dan sesi login akun MatchLab Anda.",
};

export default async function AccountPage() {
  const user = await requireUser("/account");

  // Fetch active sessions for this user
  const activeSessions = await db.session.findMany({
    where: {
      userId: user.id,
      expiresAt: { gt: new Date() },
    },
    orderBy: { lastSeenAt: "desc" },
  });

  const isSuperAdmin = user.systemRole === "SUPER_ADMIN";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />

      <main className="flex-1 container max-w-4xl mx-auto px-4 sm:px-8 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pengaturan Akun</h1>
          <p className="text-sm text-muted-foreground">
            Kelola profil pribadi, kata sandi, dan status keamanan akun Anda.
          </p>
        </div>

        {/* 1. Profile Information */}
        <section className="bg-card border rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b">
            <User className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-base font-semibold">Profil Pribadi</h2>
              <p className="text-xs text-muted-foreground">Informasi identitas akun Anda</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-2 text-xs">
            <div>
              <span className="text-muted-foreground block mb-0.5">Alamat Email</span>
              <span className="font-medium text-foreground">{user.email}</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-0.5">Status Verifikasi</span>
              <span className={user.emailVerified ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>
                {user.emailVerified ? "✓ Terverifikasi" : "Belum Terverifikasi"}
              </span>
            </div>
          </div>

          <AccountProfileForm initialName={user.name} />
        </section>

        {/* 2. Password & Security */}
        <section className="bg-card border rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b">
            <KeyRound className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-base font-semibold">Ubah Password</h2>
              <p className="text-xs text-muted-foreground">Perbarui password akun Anda secara berkala</p>
            </div>
          </div>

          <AccountPasswordForm />
        </section>

        {/* 3. Active Sessions */}
        <section className="bg-card border rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <div>
                <h2 className="text-base font-semibold">Sesi Aktif ({activeSessions.length})</h2>
                <p className="text-xs text-muted-foreground">
                  Daftar perangkat yang saat ini masuk ke akun Anda
                </p>
              </div>
            </div>
            <SignOutOtherSessionsButton count={activeSessions.length} />
          </div>

          <div className="divide-y text-xs">
            {activeSessions.map((s) => {
              const isCurrent = s.id === user.sessionId;
              const isMobile = s.userAgent?.toLowerCase().includes("mobile");

              return (
                <div key={s.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                      {isMobile ? <Smartphone className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-medium text-foreground flex items-center gap-2">
                        <span>{s.userAgent ? s.userAgent.slice(0, 48) : "Browser"}</span>
                        {isCurrent && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-700 dark:text-green-400 font-semibold">
                            Sesi Ini
                          </span>
                        )}
                      </div>
                      <div className="text-muted-foreground text-[11px] mt-0.5">
                        IP: {s.ipAddress || "Tidak diketahui"} • Aktif terakhir:{" "}
                        {new Date(s.lastSeenAt).toLocaleString("id-ID")}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. Danger Zone */}
        <section className="border border-destructive/30 rounded-2xl p-6 bg-destructive/5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-destructive/20">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <div>
              <h2 className="text-base font-semibold text-destructive">Hapus Akun</h2>
              <p className="text-xs text-muted-foreground">Tindakan ini tidak dapat dibatalkan</p>
            </div>
          </div>

          <DeleteAccountForm isSuperAdmin={isSuperAdmin} />
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
