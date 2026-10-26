import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Sparkles, Building2, Check } from "lucide-react";
import { requireVerifiedUser } from "@/lib/auth/guards";
import { PLANS } from "@/lib/billing/plans";
import { OnboardingForm } from "@/modules/auth/components/OnboardingForm";

export const metadata: Metadata = {
  title: "Setup Organisasi",
  description: "Buat organisasi baru Anda di MatchLab.",
};

export default async function OnboardingPage() {
  const user = await requireVerifiedUser("/onboarding");

  if (user.systemRole === "JOB_SEEKER") {
    redirect("/candidate/dashboard");
  }

  if (user.memberships.length > 0 && user.activeOrgId) {
    redirect("/dashboard");
  }

  const freePlan = PLANS.FREE;

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-muted/20">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <div className="inline-flex items-center gap-2 font-bold text-2xl tracking-tight mb-2">
          <span className="p-2 rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Sparkles className="w-5 h-5" />
          </span>
          <span>MatchLab</span>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Selamat Datang, {user.name}!
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Langkah terakhir: buat profil organisasi atau lab Anda untuk mulai merekrut kandidat.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl space-y-6">
        <div className="bg-card border p-6 sm:p-8 rounded-2xl shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Informasi Organisasi</h3>
              <p className="text-xs text-muted-foreground">
                Profil ini akan dilihat oleh kandidat saat melamar lowongan.
              </p>
            </div>
          </div>

          <OnboardingForm />

          <div className="rounded-xl bg-muted/40 p-4 border text-xs space-y-2">
            <div className="font-semibold text-foreground flex items-center justify-between">
              <span>Termasuk dalam Paket Gratis Starter:</span>
              <span className="text-primary font-bold">Gratis Rp 0</span>
            </div>
            <ul className="space-y-1 text-muted-foreground">
              {freePlan.features.map((f, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
