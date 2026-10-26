import { Building2, Users, Briefcase, Sparkles, Coins, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatIdr } from "@/lib/billing/plans";
import type { SuperAdminKpi } from "../types";

interface OverviewKpiCardsProps {
  kpis: SuperAdminKpi;
}

export function OverviewKpiCards({ kpis }: OverviewKpiCardsProps) {
  const formattedTokenCost = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(kpis.estimatedIdrCost);

  const formattedTokens = new Intl.NumberFormat("id-ID").format(kpis.totalTokensUsed);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Revenue */}
      <Card className="border border-border/80 shadow-xs hover:border-primary/40 transition-colors bg-gradient-to-br from-card to-emerald-500/5">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total Revenue Midtrans
          </CardTitle>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <DollarSign className="w-4 h-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-extrabold tracking-tight text-emerald-700 dark:text-emerald-400">
            {formatIdr(kpis.totalRevenueIdr)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Bulan ini: {formatIdr(kpis.revenueThisMonthIdr)} • {kpis.payingOrgsCount} org berbayar
          </p>
        </CardContent>
      </Card>

      {/* 2. Total Organizations */}
      <Card className="border border-border/80 shadow-xs hover:border-primary/40 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total Organisasi
          </CardTitle>
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Building2 className="w-4 h-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-extrabold tracking-tight">{kpis.totalCompanies}</div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Tenant terdaftar (Lab & Perusahaan)
          </p>
        </CardContent>
      </Card>

      {/* 3. Total Job Seekers */}
      <Card className="border border-border/80 shadow-xs hover:border-primary/40 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Job Seekers & Lowongan
          </CardTitle>
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Users className="w-4 h-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-extrabold tracking-tight">{kpis.totalJobSeekers} Pelamar</div>
          <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
            <Briefcase className="w-3 h-3" />
            <span>{kpis.totalActiveJobs} lowongan aktif di bursa</span>
          </p>
        </CardContent>
      </Card>

      {/* 4. Total LLM Tokens Used & Rupiah Cost */}
      <Card className="border border-border/80 shadow-xs hover:border-primary/40 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Konsumsi Token AI
          </CardTitle>
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-extrabold tracking-tight text-foreground">
            {formattedTokens}
          </div>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-muted-foreground">
            <Coins className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Biaya LLM: {formattedTokenCost}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
