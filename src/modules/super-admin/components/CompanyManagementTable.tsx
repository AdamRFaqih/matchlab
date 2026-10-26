"use client";

import { useState, useTransition } from "react";
import type { PlanTier } from "@prisma/client";
import {
  Building2,
  CheckCircle2,
  XCircle,
  Search,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Save,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CompanyItem } from "../types";
import {
  toggleOrgVerificationAction,
  updateOrgPlanAction,
} from "../actions";

interface CompanyManagementTableProps {
  initialCompanies: CompanyItem[];
}

export function CompanyManagementTable({ initialCompanies }: CompanyManagementTableProps) {
  const [companies, setCompanies] = useState<CompanyItem[]>(initialCompanies);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingQuotas, setEditingQuotas] = useState<Record<string, number>>({});
  const [editingPlans, setEditingPlans] = useState<Record<string, PlanTier>>({});
  const [, startTransition] = useTransition();
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const filteredCompanies = companies.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q) ||
      (c.cultureDescription && c.cultureDescription.toLowerCase().includes(q))
    );
  });

  const handleToggleVerification = (orgId: string, currentStatus: boolean) => {
    setActionInProgress(`verify-${orgId}`);
    startTransition(async () => {
      const newStatus = !currentStatus;
      const res = await toggleOrgVerificationAction(orgId, newStatus);
      if (res.success) {
        setCompanies((prev) =>
          prev.map((c) => (c.id === orgId ? { ...c, isVerified: newStatus } : c))
        );
      }
      setActionInProgress(null);
    });
  };

  const handlePlanChange = (orgId: string, newPlan: PlanTier) => {
    setEditingPlans((prev) => ({ ...prev, [orgId]: newPlan }));
  };

  const handleQuotaChange = (orgId: string, newQuota: number) => {
    setEditingQuotas((prev) => ({ ...prev, [orgId]: newQuota }));
  };

  const handleSavePlanAndQuota = (orgId: string, currentPlan: PlanTier, currentQuota: number) => {
    const targetPlan = editingPlans[orgId] || currentPlan;
    const targetQuota = editingQuotas[orgId] !== undefined ? editingQuotas[orgId] : currentQuota;

    setActionInProgress(`save-${orgId}`);
    startTransition(async () => {
      const res = await updateOrgPlanAction(orgId, targetPlan, targetQuota);
      if (res.success) {
        setCompanies((prev) =>
          prev.map((c) =>
            c.id === orgId
              ? { ...c, planTier: targetPlan, applicantQuota: targetQuota }
              : c
          )
        );
        // Clear edit state for this item
        setEditingPlans((prev) => {
          const next = { ...prev };
          delete next[orgId];
          return next;
        });
        setEditingQuotas((prev) => {
          const next = { ...prev };
          delete next[orgId];
          return next;
        });
      }
      setActionInProgress(null);
    });
  };

  return (
    <Card className="border border-border/80 shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Manajemen Organisasi / Perusahaan
          </CardTitle>
          <CardDescription>
            Kelola verifikasi tenant, paket langganan (PlanTier), dan alokasi kuota pelamar.
          </CardDescription>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari organisasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-sm h-9"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="py-3 px-4">Organisasi</th>
                <th className="py-3 px-4">Status Verifikasi</th>
                <th className="py-3 px-4">Paket (PlanTier)</th>
                <th className="py-3 px-4">Kuota Pelamar</th>
                <th className="py-3 px-4">Statistik</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground text-sm">
                    Tidak ada organisasi yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((company) => {
                  const currentPlan = editingPlans[company.id] || company.planTier;
                  const currentQuota =
                    editingQuotas[company.id] !== undefined
                      ? editingQuotas[company.id]
                      : company.applicantQuota;
                  const hasPendingChanges =
                    editingPlans[company.id] !== undefined ||
                    editingQuotas[company.id] !== undefined;
                  const isVerifying = actionInProgress === `verify-${company.id}`;
                  const isSaving = actionInProgress === `save-${company.id}`;

                  return (
                    <tr key={company.id} className="hover:bg-muted/20 transition-colors">
                      {/* Name & Slug */}
                      <td className="py-3 px-4 align-top">
                        <div className="font-semibold text-foreground">{company.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          /{company.slug}
                        </div>
                        {company.cultureDescription && (
                          <p className="text-xs text-muted-foreground/80 line-clamp-1 max-w-xs mt-1">
                            {company.cultureDescription}
                          </p>
                        )}
                      </td>

                      {/* Status Verifikasi */}
                      <td className="py-3 px-4 align-top">
                        <div className="flex items-center gap-1.5">
                          {company.isVerified ? (
                            <Badge
                              variant="default"
                              className="bg-emerald-600 hover:bg-emerald-600/90 text-white flex items-center gap-1"
                            >
                              <ShieldCheck className="w-3 h-3" />
                              Terverifikasi
                            </Badge>
                          ) : (
                            <Badge
                              variant="destructive"
                              className="flex items-center gap-1"
                            >
                              <ShieldAlert className="w-3 h-3" />
                              Tertunda / Ditangguhkan
                            </Badge>
                          )}
                        </div>
                      </td>

                      {/* Plan Tier Selector */}
                      <td className="py-3 px-4 align-top">
                        <select
                          value={currentPlan}
                          onChange={(e) =>
                            handlePlanChange(company.id, e.target.value as PlanTier)
                          }
                          className="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="PAY_PER_OPREC">PAY_PER_OPREC</option>
                          <option value="SME_PRO">SME_PRO</option>
                        </select>
                      </td>

                      {/* Applicant Quota */}
                      <td className="py-3 px-4 align-top">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={1}
                            max={10000}
                            value={currentQuota}
                            onChange={(e) =>
                              handleQuotaChange(company.id, parseInt(e.target.value) || 0)
                            }
                            className="h-8 w-24 text-xs font-mono"
                          />
                          <span className="text-xs text-muted-foreground">pelamar</span>
                        </div>
                      </td>

                      {/* Stats */}
                      <td className="py-3 px-4 align-top text-xs text-muted-foreground whitespace-nowrap">
                        <div>
                          <span className="font-semibold text-foreground">
                            {company.jobCount}
                          </span>{" "}
                          lowongan
                        </div>
                        <div>
                          <span className="font-semibold text-foreground">
                            {company.memberCount}
                          </span>{" "}
                          anggota tim
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 align-top text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {hasPendingChanges && (
                            <Button
                              size="sm"
                              variant="default"
                              disabled={isSaving}
                              onClick={() =>
                                handleSavePlanAndQuota(
                                  company.id,
                                  company.planTier,
                                  company.applicantQuota
                                )
                              }
                              className="h-8 text-xs gap-1"
                            >
                              {isSaving ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Save className="w-3 h-3" />
                              )}
                              Simpan
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant={company.isVerified ? "outline" : "default"}
                            disabled={isVerifying}
                            onClick={() =>
                              handleToggleVerification(company.id, company.isVerified)
                            }
                            className="h-8 text-xs"
                          >
                            {isVerifying ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : company.isVerified ? (
                              <span className="text-destructive flex items-center gap-1">
                                <XCircle className="w-3 h-3" />
                                Tangguhkan
                              </span>
                            ) : (
                              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Verifikasi
                              </span>
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
