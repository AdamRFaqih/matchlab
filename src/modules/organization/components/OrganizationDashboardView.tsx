"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  ShieldCheck,
  Plus,
  Users,
  Trophy,
  Copy,
  Check,
  ExternalLink,
  Settings,
  Sparkles,
  Briefcase,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import type { OrganizationDashboardData } from "../types";
import { cn } from "@/lib/utils";

interface OrganizationDashboardViewProps {
  data: OrganizationDashboardData;
}

export function OrganizationDashboardView({ data }: OrganizationDashboardViewProps) {
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const handleCopyLink = (slug: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/apply/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const { organization, jobs, quota, isOrgAdmin } = data;

  return (
    <div className="space-y-6">
      {/* Organization Header & Quota Card */}
      <Card className="border border-border/80 shadow-xs bg-gradient-to-r from-card via-card to-primary/5">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Org identity */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Building2 className="w-5 h-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold tracking-tight text-foreground">
                      {organization.name}
                    </h2>
                    {organization.isVerified && (
                      <span title="Organisasi Terverifikasi">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </span>
                    )}
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {organization.planTier}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    ID Tenant: {organization.slug}
                  </p>
                </div>
              </div>

              {organization.cultureDescription && (
                <div className="text-xs text-muted-foreground max-w-2xl italic bg-muted/40 p-2.5 rounded-lg border">
                  <span className="font-semibold text-foreground/90 not-italic">Culture DNA: </span>
                  &ldquo;{organization.cultureDescription}&rdquo;
                </div>
              )}
            </div>

            {/* Quota Progress & Settings Action */}
            <div className="flex flex-col sm:items-end gap-3 min-w-[240px]">
              <div className="w-full space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Sisa Kuota Pelamar:</span>
                  <span className="font-bold text-foreground font-mono">
                    {quota.remaining} dari {quota.total} ({100 - quota.percentage}% sisa)
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden border">
                  <div
                    className={cn(
                      "h-full transition-all",
                      quota.percentage > 85 ? "bg-amber-500" : "bg-primary"
                    )}
                    style={{ width: `${quota.percentage}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {quota.used} pelamar telah mendaftar di semua lowongan tim Anda.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {isOrgAdmin && (
                  <Link
                    href="/dashboard/settings"
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs gap-1")}
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Pengaturan Organisasi
                  </Link>
                )}
                <Link
                  href="/dashboard/jobs/new"
                  className={cn(buttonVariants({ size: "sm" }), "text-xs gap-1 font-semibold")}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Buat Lowongan Baru
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job Requisitions Section */}
      <Card className="border border-border/80 shadow-xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-2">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              Daftar Lowongan Kerja & Riset
            </CardTitle>
            <CardDescription>
              Semua posisi di bawah naungan {organization.name}. Data pelamar dan leaderboard terisolasi khusus tim Anda.
            </CardDescription>
          </div>
          <Link
            href="/jobs"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-xs gap-1 text-muted-foreground hover:text-foreground")}
          >
            Lihat Bursa Publik
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {jobs.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <FileText className="w-10 h-10 mx-auto text-muted-foreground/60" />
              <h4 className="font-semibold text-foreground">Belum Ada Lowongan</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Gunakan AI Requirement Translator untuk merumuskan lowongan pertama Anda dalam hitungan detik.
              </p>
              <Link
                href="/dashboard/jobs/new"
                className={cn(buttonVariants({ size: "sm" }), "text-xs font-semibold gap-1")}
              >
                <Plus className="w-3.5 h-3.5" />
                Mulai Buat Lowongan (Flow A)
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/10 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-foreground">
                        {job.title}
                      </span>
                      {job.isActive ? (
                        <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 text-[10px]">
                          Aktif
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground text-[10px]">
                          Nonaktif
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="font-mono">slug: /{job.slug}</span>
                      <span>•</span>
                      <span>
                        Dibuat:{" "}
                        {new Date(job.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span>•</span>
                      <span>{job.maxTurns} giliran wawancara</span>
                    </div>

                    <div className="flex items-center gap-3 pt-1 text-xs">
                      <span className="flex items-center gap-1 font-semibold text-foreground">
                        <Users className="w-3.5 h-3.5 text-primary" />
                        {job.totalApplicants} pelamar
                      </span>
                      <span>•</span>
                      <span className="text-purple-600 dark:text-purple-400 font-medium">
                        {job.evaluatedCount} dievaluasi
                      </span>
                      <span>•</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        {job.shortlistedCount} shortlisted
                      </span>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="flex items-center gap-2 self-start md:self-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyLink(job.slug)}
                      className="h-8 text-xs gap-1"
                    >
                      {copiedSlug === job.slug ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          Tersalin!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Salin Link
                        </>
                      )}
                    </Button>

                    <Link
                      href={`/apply/${job.slug}`}
                      target="_blank"
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 text-xs gap-1")}
                    >
                      <ExternalLink className="w-3 h-3" />
                      Buka Form
                    </Link>

                    <Link
                      href={`/dashboard/jobs/${job.id}`}
                      className={cn(
                        buttonVariants({ size: "sm" }),
                        "h-8 text-xs font-semibold gap-1 bg-primary text-primary-foreground"
                      )}
                    >
                      <Sparkles className="w-3 h-3" />
                      Leaderboard AI (Flow C)
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
