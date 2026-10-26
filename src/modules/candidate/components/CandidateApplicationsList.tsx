"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Building2,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Clock,
  CheckCircle2,
  Trophy,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import type { CandidateApplicationItem } from "../types";
import { cn } from "@/lib/utils";

interface CandidateApplicationsListProps {
  applications: CandidateApplicationItem[];
  stats: {
    totalApplications: number;
    inProgress: number;
    evaluated: number;
    shortlisted: number;
  };
}

export function CandidateApplicationsList({
  applications,
  stats,
}: CandidateApplicationsListProps) {
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedAppId((prev) => (prev === id ? null : id));
  };

  const getStatusBadge = (status: CandidateApplicationItem["status"]) => {
    switch (status) {
      case "REGISTERED":
        return <Badge variant="outline">Terdaftar</Badge>;
      case "IN_PROGRESS":
        return (
          <Badge variant="default" className="bg-amber-600 hover:bg-amber-600/90 text-white">
            Wawancara AI Berlangsung
          </Badge>
        );
      case "COMPLETED_SCREENING":
        return (
          <Badge variant="default" className="bg-blue-600 hover:bg-blue-600/90 text-white">
            Menunggu Hasil Evaluasi
          </Badge>
        );
      case "EVALUATED":
        return (
          <Badge variant="default" className="bg-purple-600 hover:bg-purple-600/90 text-white">
            Telah Dievaluasi AI
          </Badge>
        );
      case "SHORTLISTED":
        return (
          <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600/90 text-white">
            Lolos Shortlist Tim
          </Badge>
        );
      case "REJECTED":
        return <Badge variant="destructive">Belum Lolos</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border border-border/80 shadow-xs">
          <CardContent className="p-4">
            <div className="text-xs font-medium text-muted-foreground">Total Lamaran</div>
            <div className="text-2xl font-extrabold mt-1">{stats.totalApplications}</div>
          </CardContent>
        </Card>
        <Card className="border border-border/80 shadow-xs">
          <CardContent className="p-4">
            <div className="text-xs font-medium text-muted-foreground">Sedang Berjalan</div>
            <div className="text-2xl font-extrabold mt-1 text-amber-600 dark:text-amber-400">
              {stats.inProgress}
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border/80 shadow-xs">
          <CardContent className="p-4">
            <div className="text-xs font-medium text-muted-foreground">Selesai Evaluasi</div>
            <div className="text-2xl font-extrabold mt-1 text-purple-600 dark:text-purple-400">
              {stats.evaluated}
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border/80 shadow-xs">
          <CardContent className="p-4">
            <div className="text-xs font-medium text-muted-foreground">Shortlisted</div>
            <div className="text-2xl font-extrabold mt-1 text-emerald-600 dark:text-emerald-400">
              {stats.shortlisted}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications List */}
      <Card className="border border-border/80 shadow-xs">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            Lamaran Saya
          </CardTitle>
          <CardDescription>
            Pantau status proses wawancara AI, lanjutkan giliran yang tertunda, dan lihat rangkuman umpan balik kekuatan Anda.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {applications.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Briefcase className="w-10 h-10 mx-auto text-muted-foreground/60" />
              <h4 className="font-semibold text-foreground">Belum Ada Lamaran Aktif</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Anda belum melamar ke lowongan mana pun. Jelajahi bursa lowongan publik dan ikuti wawancara screening AI.
              </p>
              <Link
                href="/jobs"
                className={cn(buttonVariants({ size: "sm" }), "text-xs mt-2")}
              >
                Cari Lowongan Sekarang
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {applications.map((app) => {
                const isExpanded = expandedAppId === app.id;
                const showFeedback = app.evaluation !== null;
                const canResume =
                  app.status === "IN_PROGRESS" ||
                  app.status === "REGISTERED" ||
                  (!app.isCompleted && app.status !== "REJECTED");

                return (
                  <div key={app.id} className="p-4 hover:bg-muted/10 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-base text-foreground">
                            {app.jobTitle}
                          </span>
                          {getStatusBadge(app.status)}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1 font-medium text-foreground/80">
                            <Building2 className="w-3.5 h-3.5" />
                            {app.organizationName}
                          </span>
                          {app.organizationVerified && (
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          )}
                          <span>•</span>
                          <span>
                            {new Date(app.appliedAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Right action area */}
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <div className="text-xs text-muted-foreground mr-2 font-mono flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {app.turnCount} / {app.maxTurns} giliran
                        </div>

                        {canResume && (
                          <Link
                            href={`/apply/${app.jobSlug}`}
                            className={cn(
                              buttonVariants({ size: "sm" }),
                              "h-8 text-xs font-semibold gap-1 bg-amber-600 hover:bg-amber-600/90 text-white"
                            )}
                          >
                            Lanjutkan Wawancara AI
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        )}

                        {showFeedback && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleExpand(app.id)}
                            className="h-8 text-xs gap-1 border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-500/10"
                          >
                            <Sparkles className="w-3 h-3 text-purple-600" />
                            <span>Feedback AI</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Shortlist Celebration Notification */}
                    {app.status === "SHORTLISTED" && (
                      <div className="mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          <strong>Selamat!</strong> Tim {app.organizationName} telah memasukkan Anda ke dalam shortlist pelamar unggulan. Tunggu kabar undangan interview final dari tim HR.
                        </span>
                      </div>
                    )}

                    {/* Expandable AI Strengths Feedback */}
                    {isExpanded && app.evaluation && (
                      <div className="mt-4 p-4 rounded-xl border bg-purple-500/5 dark:bg-purple-950/10 border-purple-500/20 space-y-4 text-xs animate-in fade-in-50">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-500/20 pb-2">
                          <div className="font-semibold text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-purple-600" />
                            Rangkuman Umpan Balik AI (Strengths & Insights)
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-[11px] font-mono">
                              <span className="text-muted-foreground">Domain:</span>
                              <span className="font-bold">{app.evaluation.domainScore}/100</span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] font-mono">
                              <span className="text-muted-foreground">Karakter/Tim:</span>
                              <span className="font-bold">
                                {app.evaluation.implicitBehaviorScore}/100
                              </span>
                            </div>
                            <Badge className="bg-purple-600 text-white font-mono">
                              Match Score: {app.evaluation.matchScore}/100
                            </Badge>
                          </div>
                        </div>

                        {/* Executive Summary */}
                        <div className="space-y-1">
                          <div className="font-semibold text-foreground text-[11px]">
                            Vonis Analisis AI:
                          </div>
                          <p className="text-muted-foreground leading-relaxed italic">
                            &ldquo;{app.evaluation.executiveSummary}&rdquo;
                          </p>
                        </div>

                        {/* Green Flags (Strengths) */}
                        {app.evaluation.greenFlags.length > 0 && (
                          <div className="space-y-1.5">
                            <div className="font-semibold text-emerald-700 dark:text-emerald-400 text-[11px] flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Kekuatan & Bukti Positif yang Teridentifikasi:
                            </div>
                            <ul className="list-disc list-inside space-y-0.5 text-muted-foreground pl-1">
                              {app.evaluation.greenFlags.map((flag, idx) => (
                                <li key={idx}>{flag}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Constructive Probes */}
                        {app.evaluation.finalInterviewProbes.length > 0 && (
                          <div className="space-y-1.5">
                            <div className="font-semibold text-foreground text-[11px] flex items-center gap-1">
                              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                              Area Pendalaman untuk Tahap Berikutnya:
                            </div>
                            <ul className="list-disc list-inside space-y-0.5 text-muted-foreground pl-1">
                              {app.evaluation.finalInterviewProbes.map((probe, idx) => (
                                <li key={idx}>{probe}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
