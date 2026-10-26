import type { PlanTier } from "@prisma/client";

/**
 * Single source of truth for pricing & plan limits. Used by the pricing page,
 * billing checkout, quota enforcement and the Super Admin panel.
 *
 * Amounts are integer Rupiah (IDR). Override via env if needed without code changes.
 */

export interface PlanDefinition {
  tier: PlanTier;
  name: string;
  tagline: string;
  /** Price in IDR. 0 = free. */
  price: number;
  billing: "free" | "one_time" | "monthly";
  /** Applicants granted per purchase (PAY_PER_OPREC) or per period (FREE / SME_PRO). */
  applicantQuota: number;
  /** Length of a paid period in days (subscriptions only). */
  periodDays?: number;
  maxActiveJobs: number | null; // null = unlimited
  maxMembers: number | null;
  features: string[];
  highlighted?: boolean;
  purchasable: boolean;
}

const envInt = (key: string, fallback: number) => {
  const v = Number(process.env[key]);
  return Number.isFinite(v) && v > 0 ? Math.floor(v) : fallback;
};

export const PLANS: Record<PlanTier, PlanDefinition> = {
  FREE: {
    tier: "FREE",
    name: "Free",
    tagline: "Coba MatchLab untuk rekrutmen kecil pertama Anda.",
    price: 0,
    billing: "free",
    applicantQuota: envInt("PLAN_FREE_QUOTA", 20),
    maxActiveJobs: 1,
    maxMembers: 2,
    features: [
      "20 pelamar AI-screened",
      "1 lowongan aktif",
      "2 anggota tim",
      "AI Requirement Translator",
      "Leaderboard & skor kecocokan",
    ],
    purchasable: false,
  },
  PAY_PER_OPREC: {
    tier: "PAY_PER_OPREC",
    name: "Pay per Oprec",
    tagline: "Bayar sekali per gelombang open recruitment.",
    price: envInt("PLAN_OPREC_PRICE", 149_000),
    billing: "one_time",
    applicantQuota: envInt("PLAN_OPREC_QUOTA", 150),
    maxActiveJobs: 5,
    maxMembers: 10,
    features: [
      "+150 kredit pelamar (tidak hangus)",
      "Hingga 5 lowongan aktif",
      "10 anggota tim",
      "Wawancara AI 8 giliran",
      "Ringkasan evaluasi & probe wawancara",
    ],
    purchasable: true,
  },
  SME_PRO: {
    tier: "SME_PRO",
    name: "SME Pro",
    tagline: "Untuk tim yang merekrut sepanjang tahun.",
    price: envInt("PLAN_PRO_PRICE", 499_000),
    billing: "monthly",
    applicantQuota: envInt("PLAN_PRO_QUOTA", 750),
    periodDays: 30,
    maxActiveJobs: null,
    maxMembers: null,
    features: [
      "750 pelamar / bulan",
      "Lowongan aktif tanpa batas",
      "Anggota tim tanpa batas",
      "Badge organisasi terverifikasi",
      "Dukungan prioritas",
    ],
    highlighted: true,
    purchasable: true,
  },
};

export const PLAN_ORDER: PlanTier[] = ["FREE", "PAY_PER_OPREC", "SME_PRO"];

export function getPlan(tier: PlanTier): PlanDefinition {
  return PLANS[tier];
}

export function formatIdr(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}
