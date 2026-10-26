"use client";

import { useState, useTransition } from "react";
import type { PlanTier } from "@prisma/client";
import {
  Building2,
  Search,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Save,
  Ban,
  Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CompanyItem } from "../types";
import {
  toggleOrganizationVerificationAction,
  toggleOrganizationSuspensionAction,
  updateOrganizationPlanAction,
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
      const res = await toggleOrganizationVerificationAction(orgId, newStatus);
      if (res.success) {
        setCompanies((prev) =>
          prev.map((c) => (c.id === orgId ? { ...c, isVerified: newStatus } : c))
        );
      }
      setActionInProgress(null);
    });
  };

  const handleToggleSuspension = (orgId: string, currentSuspended: boolean) => {
    const newSuspended = !currentSuspended;
    const confirmMsg = newSuspended
      ? "Tangguhkan organisasi ini? Semua lowongan akan ditutup dan pendaftaran diblokir."
      : "Pulihkan organisasi ini dari penangguhan?";

    if (!confirm(confirmMsg)) return;

    setActionInProgress(`suspend-${orgId}`);
    startTransition(async () => {
      const res = await toggleOrganizationSuspensionAction(orgId, newSuspended);
      if (res.success) {
        setCompanies((prev) =>
          prev.map((c) => (c.id === orgId ? { ...c, isSuspended: newSuspended } : c))
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
      const res = await updateOrganizationPlanAction(orgId, targetPlan, targetQuota);
      if (res.success) {
        setCompanies((prev) =>
          prev.map((c) =>
            c.id === orgId
              ? { ...c, planTier: targetPlan, applicantQuota: targetQuota }
              : c
          )
        );
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
    <Card className="border border-border/80 shadow-xs">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Manajemen Organisasi / Perusahaan
          </CardTitle>
          <CardDescription>
            Kelola verifikasi tenant, paket langganan (FREE / PAY_PER_OPREC / SME_PRO), dan alokasi kuota pelamar.
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
                <th className="py-3 px-4">Status & Suspensi</th>
                <th className="py-3 px-4">Paket (PlanTier)</th>
                <th className="py-3 px-4">Kuota Terpakai / Total</th>
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
                  const isSuspending = actionInProgress === `suspend-${company.id}`;
                  const isSaving = actionInProgress === `save-${company.id}`;

                  return (
                    <tr key={company.id} className="hover:bg-muted/20 transition-colors">
                      {/* Name & Slug */}
                      <td className="py-3 px-4 align-top">
                        <div className="font-semibold text-foreground flex items-center gap-2">
                          <span>{company.name}</span>
                          {company.isSuspended && (
                            <Badge variant="destructive" className="text-[10px] py-0">
                              DITANGGUHKAN
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          /{company.slug}
                        </div>
                        {company.cultureDescription && (
                          <p className="text-xs text-muted-foreground/80 line-clamp-1 max-w-xs mt-1">
                            {company.cultureDescription}
                          </p>
                        )}
                      </td>

                      {/* Status Verifikasi & Suspensi */}
                      <td className="py-3 px-4 align-top">
                        <div className="flex flex-col gap-1.5 items-start">
                          <button
                            type="button"
                            onClick={() => handleToggleVerification(company.id, company.isVerified)}
                            disabled={isVerifying}
                            className="cursor-pointer"
                          >
                            {company.isVerified ? (
                              <Badge
                                variant="default"
                                className="bg-emerald-600 hover:bg-emerald-600/90 text-white flex items-center gap-1 text-[11px]"
                              >
                                <ShieldCheck className="w-3 h-3" />
                                Terverifikasi
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="flex items-center gap-1 text-[11px]"
                              >
                                <ShieldAlert className="w-3 h-3" />
                                Belum Verif
                              </Badge>
                            )}
                          </button>
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
                          <option value="FREE">FREE</option>
                          <option value="PAY_PER_OPREC">PAY_PER_OPREC</option>
                          <option value="SME_PRO">SME_PRO</option>
                        </select>
                      </td>

                      {/* Applicant Quota */}
                      <td className="py-3 px-4 align-top">
                        <div className="flex items-center gap-1.5">
                          <Input
                            type="number"
                            min={1}
                            max={50000}
                            value={currentQuota}
                            onChange={(e) =>
                              handleQuotaChange(company.id, parseInt(e.target.value) || 0)
                            }
                            className="h-8 w-20 text-xs font-mono"
                          />
                          <span className="text-xs text-muted-foreground">
                            (used: {company.applicantsUsed})
                          </span>
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
                        <div className="flex items-center justify-end gap-1.5">
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
                              className="h-7 text-xs gap-1"
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
                            variant="ghost"
                            disabled={isSuspending}
                            onClick={() => handleToggleSuspension(company.id, company.isSuspended)}
                            className={`h-7 text-xs gap-1 ${
                              company.isSuspended
                                ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                                : "text-destructive hover:text-destructive hover:bg-destructive/10"
                            }`}
                          >
                            {isSuspending ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : company.isSuspended ? (
                              <>
                                <Check className="w-3 h-3" />
                                Pulihkan
                              </>
                            ) : (
                              <>
                                <Ban className="w-3 h-3" />
                                Tangguhkan
                              </>
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
