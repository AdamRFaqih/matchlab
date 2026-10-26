import type { Metadata } from "next";
import Link from "next/link";
import { Check, Sparkles, HelpCircle, ArrowRight } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { PLANS, PLAN_ORDER, formatIdr } from "@/lib/billing/plans";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Paket & Harga",
  description: "Pilihan paket rekrutmen transparan untuk tim kecil, lab universitas, hingga startup yang berkembang.",
};

export default async function PricingPage() {
  const user = await getSession();
  const isCompany = user?.systemRole === "COMPANY_USER";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="py-16 md:py-24 text-center px-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pilihan Paket Terbuka & Fleksibel</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Hemat Waktu Screening Rekrutmen Hingga 80%
          </h1>
          <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Gunakan AI Interviewer untuk menguji kualifikasi teknis dan perilaku kandidat secara objektif. Mulai gratis tanpa kartu kredit.
          </p>
        </section>

        {/* Pricing Cards */}
        <section className="container max-w-7xl mx-auto px-4 sm:px-8 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {PLAN_ORDER.map((tier) => {
              const plan = PLANS[tier];
              const isHighlight = Boolean(plan.highlighted);

              let ctaHref = "/signup?type=company";
              let ctaText = "Mulai Gratis";

              if (tier === "FREE") {
                ctaHref = isCompany ? "/dashboard" : "/signup?type=company";
                ctaText = isCompany ? "Buka Dashboard" : "Mulai Gratis";
              } else {
                ctaHref = isCompany
                  ? `/dashboard/billing?plan=${plan.tier}`
                  : `/signup?type=company&next=${encodeURIComponent(`/dashboard/billing?plan=${plan.tier}`)}`;
                ctaText = isCompany ? `Pilih ${plan.name}` : `Daftar & Beli ${plan.name}`;
              }

              return (
                <div
                  key={plan.tier}
                  className={`relative rounded-3xl p-8 flex flex-col justify-between border transition-all ${
                    isHighlight
                      ? "border-primary bg-card shadow-xl ring-2 ring-primary/20"
                      : "border-border bg-card/60 shadow-sm hover:shadow-md"
                  }`}
                >
                  {isHighlight && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold tracking-wide uppercase shadow-sm">
                      Paling Populer
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h3 className="text-xl font-bold">{plan.name}</h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-muted font-medium text-muted-foreground">
                        {plan.applicantQuota} Pelamar
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground min-h-[36px] mb-6">
                      {plan.tagline}
                    </p>

                    <div className="mb-6 pb-6 border-b">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                          {plan.price === 0 ? "Rp 0" : formatIdr(plan.price)}
                        </span>
                        {plan.billing === "monthly" && (
                          <span className="text-xs text-muted-foreground">/ bulan</span>
                        )}
                        {plan.billing === "one_time" && (
                          <span className="text-xs text-muted-foreground">/ kali bayar</span>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground mt-1 block">
                        {plan.billing === "one_time"
                          ? "Kredit kuota tidak pernah hangus"
                          : plan.billing === "monthly"
                          ? "Termasuk perpanjangan kuota bulanan"
                          : "Tanpa batas waktu"}
                      </span>
                    </div>

                    <div className="space-y-3 mb-8">
                      <div className="text-xs font-semibold text-foreground uppercase tracking-wider">
                        Fitur yang didapatkan:
                      </div>
                      <ul className="space-y-2.5 text-xs text-muted-foreground">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <Link
                      href={ctaHref}
                      className={buttonVariants({
                        variant: isHighlight ? "default" : "outline",
                        className: "w-full gap-2 rounded-xl h-10",
                      })}
                    >
                      {ctaText}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="border-t bg-muted/20 py-16">
          <div className="container max-w-4xl mx-auto px-4 sm:px-8 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Pertanyaan yang Sering Diajukan</h2>
              <p className="text-sm text-muted-foreground">
                Informasi seputar cara kerja kuota, pembayaran Midtrans, dan wawancara AI.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 text-sm">
              <div className="bg-card border p-5 rounded-2xl space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-primary shrink-0" />
                  Bagaimana sistem kuota dihitung?
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  1 kuota pelamar hanya dipotong ketika kandidat resmi mendaftar dan memulai wawancara AI. Pengunjung yang hanya melihat lowongan tidak memotong kuota.
                </p>
              </div>

              <div className="bg-card border p-5 rounded-2xl space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-primary shrink-0" />
                  Metode pembayaran apa saja yang didukung?
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Kami terintegrasi dengan Midtrans Snap resmi: mendukung QRIS (GoPay, OVO, ShopeePay), Virtual Account BCA, Mandiri, BRI, BNI, serta kartu kredit/debit.
                </p>
              </div>

              <div className="bg-card border p-5 rounded-2xl space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-primary shrink-0" />
                  Apakah kuota Pay per Oprec memiliki masa kedaluwarsa?
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tidak. Kuota Pay per Oprec bersifat permanen dan tidak hangus hingga seluruh slot pelamar digunakan.
                </p>
              </div>

              <div className="bg-card border p-5 rounded-2xl space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-primary shrink-0" />
                  Bagaimana AI menilai kandidat?
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  AI mengevaluasi transkrip wawancara 8 giliran berdasarkan rubrik teknis dan perilaku implisit yang dikonfigurasi oleh tim Anda, dilengkapi ringkasan eksekutif dan rekomendasi pertanyaan lanjutan.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
