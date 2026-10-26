import { Building2, Users, Briefcase, Sparkles, Coins } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SuperAdminKpi } from "../types";

interface OverviewKpiCardsProps {
  kpis: SuperAdminKpi;
}

export function OverviewKpiCards({ kpis }: OverviewKpiCardsProps) {
  const formattedIdr = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(kpis.estimatedIdrCost);

  const formattedTokens = new Intl.NumberFormat("id-ID").format(kpis.totalTokensUsed);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Companies */}
      <Card className="border border-border/80 shadow-sm hover:border-primary/40 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Organisasi / Lab
          </CardTitle>
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Building2 className="w-4 h-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-extrabold tracking-tight">{kpis.totalCompanies}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Tenant terdaftar (Lab & Startup)
          </p>
        </CardContent>
      </Card>

      {/* 2. Total Job Seekers */}
      <Card className="border border-border/80 shadow-sm hover:border-primary/40 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Job Seekers
          </CardTitle>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Users className="w-4 h-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-extrabold tracking-tight">{kpis.totalJobSeekers}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Talenta dengan profil terpadu
          </p>
        </CardContent>
      </Card>

      {/* 3. Total Active Jobs */}
      <Card className="border border-border/80 shadow-sm hover:border-primary/40 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Lowongan Aktif
          </CardTitle>
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Briefcase className="w-4 h-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-extrabold tracking-tight">{kpis.totalActiveJobs}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Posisi siap menerima wawancara AI
          </p>
        </CardContent>
      </Card>

      {/* 4. Total LLM Tokens Used & Rupiah Cost */}
      <Card className="border border-border/80 shadow-sm hover:border-primary/40 transition-colors bg-gradient-to-br from-card via-card to-primary/5">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Token LLM
          </CardTitle>
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Sparkles className="w-4 h-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-extrabold tracking-tight text-foreground">
            {formattedTokens}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300">
            <Coins className="w-3.5 h-3.5" />
            <span>Estimasi Biaya: {formattedIdr}</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Blended Gemini/OpenRouter (~Rp 40k/1M token)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
