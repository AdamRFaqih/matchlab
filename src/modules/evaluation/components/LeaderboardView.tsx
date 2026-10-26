"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Trophy,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Bot,
  User,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react";
import type { ApplicationStatus } from "@prisma/client";
import type { JobLeaderboardData } from "../types";
import {
  updateCandidateStatusAction,
  evaluateCandidateAction,
} from "../actions";

interface LeaderboardViewProps {
  initialData: JobLeaderboardData;
}

export function LeaderboardView({ initialData }: LeaderboardViewProps) {
  const [data, setData] = useState<JobLeaderboardData>(initialData);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [expandedTranscripts, setExpandedTranscripts] = useState<Record<string, boolean>>({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/apply/${data.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const toggleTranscript = (candidateId: string) => {
    setExpandedTranscripts((prev) => ({
      ...prev,
      [candidateId]: !prev[candidateId],
    }));
  };

  const handleUpdateStatus = async (
    candidateId: string,
    newStatus: ApplicationStatus
  ) => {
    setActionLoading((prev) => ({ ...prev, [candidateId]: true }));
    try {
      const res = await updateCandidateStatusAction(candidateId, newStatus, data.id);
      if (res.success && res.status) {
        setData((prev) => ({
          ...prev,
          candidates: prev.candidates.map((c) =>
            c.id === candidateId ? { ...c, status: res.status as ApplicationStatus } : c
          ),
        }));
      }
    } finally {
      setActionLoading((prev) => ({ ...prev, [candidateId]: false }));
    }
  };

  const handleEvaluate = async (candidateId: string) => {
    setActionLoading((prev) => ({ ...prev, [candidateId]: true }));
    try {
      const res = await evaluateCandidateAction(candidateId, data.id);
      if (res.success && res.evaluation) {
        setData((prev) => ({
          ...prev,
          candidates: prev.candidates.map((c) =>
            c.id === candidateId
              ? {
                  ...c,
                  status: "EVALUATED",
                  evaluation: res.evaluation || null,
                }
              : c
          ),
        }));
      }
    } finally {
      setActionLoading((prev) => ({ ...prev, [candidateId]: false }));
    }
  };

  // Filter candidates
  const filteredCandidates = data.candidates.filter((c) => {
    if (filterStatus === "ALL") return true;
    return c.status === filterStatus;
  });

  // Calculate metrics
  const totalCount = data.candidates.length;
  const shortlistedCount = data.candidates.filter((c) => c.status === "SHORTLISTED").length;
  const evaluatedCount = data.candidates.filter(
    (c) => c.status === "EVALUATED" || c.status === "SHORTLISTED" || c.status === "REJECTED"
  ).length;
  const rejectedCount = data.candidates.filter((c) => c.status === "REJECTED").length;

  const evaluatedWithScores = data.candidates.filter((c) => c.evaluation !== null);
  const avgScore =
    evaluatedWithScores.length > 0
      ? Math.round(
          evaluatedWithScores.reduce((acc, c) => acc + (c.evaluation?.matchScore ?? 0), 0) /
            evaluatedWithScores.length
        )
      : null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-4">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
              {data.organization.name}
            </span>
            <Badge variant="outline" className="text-xs">
              Bobot Teknis: {data.scoringRubric.domainWeight}% | Karakter: {data.scoringRubric.implicitWeight}%
            </Badge>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">{data.title}</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            {data.scoringRubric.roleSummary}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-1.5">
            {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copiedLink ? "Link Disalin!" : "Salin Link /apply"}
          </Button>

          <Link
            href={`/apply/${data.slug}`}
            target="_blank"
            className={buttonVariants({ size: "sm" })}
          >
            <ExternalLink className="w-4 h-4 mr-1.5" />
            Buka Form
          </Link>
        </div>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-4">
          <CardDescription className="text-xs">Total Pelamar</CardDescription>
          <div className="text-2xl font-bold mt-1">{totalCount}</div>
        </Card>
        <Card className="p-4">
          <CardDescription className="text-xs">Ter-evaluasi</CardDescription>
          <div className="text-2xl font-bold mt-1 text-primary">{evaluatedCount}</div>
        </Card>
        <Card className="p-4">
          <CardDescription className="text-xs">Shortlisted</CardDescription>
          <div className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
            {shortlistedCount}
          </div>
        </Card>
        <Card className="p-4">
          <CardDescription className="text-xs">Rejected</CardDescription>
          <div className="text-2xl font-bold mt-1 text-muted-foreground">{rejectedCount}</div>
        </Card>
        <Card className="p-4 col-span-2 md:col-span-1">
          <CardDescription className="text-xs">Rata-Rata Match Score</CardDescription>
          <div className="text-2xl font-bold mt-1">
            {avgScore !== null ? `${avgScore} / 100` : "-"}
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b pb-3">
        {[
          { label: "Semua Kandidat", value: "ALL", count: totalCount },
          { label: "Shortlisted", value: "SHORTLISTED", count: shortlistedCount },
          { label: "Evaluated", value: "EVALUATED", count: data.candidates.filter((c) => c.status === "EVALUATED").length },
          { label: "In Progress", value: "IN_PROGRESS", count: data.candidates.filter((c) => c.status === "IN_PROGRESS" || c.status === "REGISTERED" || c.status === "COMPLETED_SCREENING").length },
          { label: "Rejected", value: "REJECTED", count: rejectedCount },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterStatus(tab.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filterStatus === tab.value
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                filterStatus === tab.value
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-background text-muted-foreground"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Candidate List */}
      {filteredCandidates.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <Trophy className="w-6 h-6 text-muted-foreground/60" />
          </div>
          <p className="font-semibold text-foreground">Belum ada kandidat pada kategori ini.</p>
          <p className="text-xs mt-1">
            Bagikan link lowongan ke kandidat untuk memulai penyaringan awal.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCandidates.map((candidate, index) => {
            const hasEval = candidate.evaluation !== null;
            const evalData = candidate.evaluation;
            const isExpanded = !!expandedTranscripts[candidate.id];
            const isLoading = !!actionLoading[candidate.id];

            return (
              <Card
                key={candidate.id}
                className={`transition-all ${
                  candidate.status === "SHORTLISTED"
                    ? "border-emerald-500/40 bg-emerald-500/[0.02]"
                    : candidate.status === "REJECTED"
                    ? "opacity-60 bg-muted/20"
                    : "border-border"
                }`}
              >
                <CardHeader className="py-4 px-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Candidate Identity */}
                    <div className="flex items-start gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted font-bold text-xs shrink-0 mt-0.5">
                        #{index + 1}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-lg">{candidate.fullName}</span>
                          <span className="text-xs text-muted-foreground">{candidate.email}</span>

                          {/* Status Badge */}
                          {candidate.status === "SHORTLISTED" && (
                            <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-xs">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Shortlisted
                            </Badge>
                          )}
                          {candidate.status === "REJECTED" && (
                            <Badge variant="destructive" className="text-xs">
                              <XCircle className="w-3 h-3 mr-1" /> Rejected
                            </Badge>
                          )}
                          {candidate.status === "EVALUATED" && (
                            <Badge variant="secondary" className="text-xs">
                              <Sparkles className="w-3 h-3 mr-1 text-primary" /> Evaluated
                            </Badge>
                          )}
                          {(candidate.status === "IN_PROGRESS" || candidate.status === "REGISTERED") && (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              Sedang Wawancara ({candidate.turnCount}/{data.maxTurns} turns)
                            </Badge>
                          )}
                          {candidate.status === "COMPLETED_SCREENING" && (
                            <Badge variant="outline" className="text-xs text-primary border-primary/30">
                              Screening Selesai
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground line-clamp-2 max-w-2xl">
                          {candidate.cvSummaryText}
                        </p>

                        {candidate.portfolioUrl && (
                          <a
                            href={candidate.portfolioUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-xs text-primary hover:underline pt-0.5"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" /> Portofolio / GitHub
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Scores & Actions */}
                    <div className="flex flex-wrap items-center gap-4 lg:self-center">
                      {hasEval && evalData ? (
                        <div className="flex items-center gap-4 bg-muted/40 p-2.5 rounded-lg border">
                          {/* Overall Match Score */}
                          <div className="text-center min-w-[70px]">
                            <div
                              className={`text-2xl font-black ${
                                evalData.matchScore >= 80
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : evalData.matchScore >= 60
                                  ? "text-primary"
                                  : "text-amber-600"
                              }`}
                            >
                              {evalData.matchScore}
                            </div>
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                              Match Score
                            </div>
                          </div>

                          <Separator orientation="vertical" className="h-8" />

                          {/* Domain & Implicit Subscores */}
                          <div className="space-y-1 text-xs font-mono">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-muted-foreground">Teknis:</span>
                              <span className="font-bold">{evalData.domainScore}%</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-muted-foreground">Karakter:</span>
                              <span className="font-bold">{evalData.implicitBehaviorScore}%</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground bg-muted/40 px-3 py-2 rounded-md">
                          {candidate.turnCount > 0 ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEvaluate(candidate.id)}
                              disabled={isLoading}
                              className="text-xs"
                            >
                              <Sparkles className="w-3.5 h-3.5 mr-1 text-primary" />
                              Evaluasi Sekarang
                            </Button>
                          ) : (
                            "Belum ada transkrip"
                          )}
                        </div>
                      )}

                      {/* Lead Decision Buttons */}
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant={candidate.status === "SHORTLISTED" ? "default" : "outline"}
                          className={
                            candidate.status === "SHORTLISTED"
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                              : "text-xs hover:border-emerald-600 hover:text-emerald-600"
                          }
                          onClick={() => handleUpdateStatus(candidate.id, "SHORTLISTED")}
                          disabled={isLoading}
                        >
                          <ThumbsUp className="w-3.5 h-3.5 mr-1" />
                          Shortlist
                        </Button>

                        <Button
                          size="sm"
                          variant={candidate.status === "REJECTED" ? "destructive" : "outline"}
                          className="text-xs"
                          onClick={() => handleUpdateStatus(candidate.id, "REJECTED")}
                          disabled={isLoading}
                        >
                          <ThumbsDown className="w-3.5 h-3.5 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {/* Evaluation Insights (Executive Summary, Green/Red Flags, Probes) */}
                {hasEval && evalData && (
                  <CardContent className="pt-0 pb-4 px-6 space-y-4">
                    {/* Executive Summary */}
                    <div className="p-3 bg-muted/30 rounded-md border text-xs leading-relaxed">
                      <span className="font-semibold text-foreground">Vonis AI Evaluator: </span>
                      <span className="text-muted-foreground">{evalData.executiveSummary}</span>
                    </div>

                    {/* Green Flags & Red Flags */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {/* Green Flags */}
                      <div className="space-y-1.5 p-3 rounded-md bg-emerald-500/5 border border-emerald-500/20">
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Green Flags ({evalData.greenFlags.length})
                        </span>
                        <ul className="space-y-1 list-disc list-inside text-muted-foreground">
                          {evalData.greenFlags.map((flag, idx) => (
                            <li key={idx} className="break-words">{flag}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Red Flags */}
                      <div className="space-y-1.5 p-3 rounded-md bg-destructive/5 border border-destructive/20">
                        <span className="font-semibold text-destructive flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Red Flags & Perhatian ({evalData.redFlags.length})
                        </span>
                        {evalData.redFlags.length > 0 ? (
                          <ul className="space-y-1 list-disc list-inside text-muted-foreground">
                            {evalData.redFlags.map((flag, idx) => (
                              <li key={idx} className="break-words">{flag}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-muted-foreground italic">Tidak ada red flag signifikan terdeteksi.</p>
                        )}
                      </div>
                    </div>

                    {/* Final Interview Probes */}
                    {evalData.finalInterviewProbes.length > 0 && (
                      <div className="p-3 rounded-md bg-card border space-y-1.5 text-xs">
                        <span className="font-semibold text-foreground flex items-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5 text-primary" /> Rekomendasi Pertanyaan untuk Final Human Interview:
                        </span>
                        <ul className="space-y-1 list-decimal list-inside text-muted-foreground">
                          {evalData.finalInterviewProbes.map((probe, idx) => (
                            <li key={idx} className="break-words">{probe}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                )}

                {/* Expandable Chat Transcript Drawer */}
                <div className="border-t px-6 py-2.5 bg-muted/10 flex items-center justify-between">
                  <button
                    onClick={() => toggleTranscript(candidate.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>
                      {isExpanded
                        ? "Sembunyikan Transkrip Wawancara"
                        : `Lihat Transkrip Lengkap (${candidate.messages.length} Pesan, ${candidate.turnCount} Giliran)`}
                    </span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  <span className="text-[11px] text-muted-foreground">
                    Terdaftar: {new Date(candidate.createdAt).toLocaleDateString("id-ID")}
                  </span>
                </div>

                {/* Transcript Body */}
                {isExpanded && (
                  <div className="border-t p-4 sm:p-6 bg-muted/20 space-y-3 max-h-96 overflow-y-auto">
                    {candidate.messages.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic text-center py-4">
                        Belum ada riwayat pesan percakapan.
                      </p>
                    ) : (
                      candidate.messages.map((m) => {
                        const isAssistant = m.role === "assistant";
                        return (
                          <div
                            key={m.id}
                            className={`flex gap-3 text-xs leading-relaxed ${
                              isAssistant ? "justify-start" : "justify-end"
                            }`}
                          >
                            {isAssistant && (
                              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                                <Bot className="w-3 h-3" />
                              </div>
                            )}

                            <div
                              className={`max-w-[85%] rounded-lg p-3 ${
                                isAssistant
                                  ? "bg-card border text-card-foreground"
                                  : "bg-primary text-primary-foreground"
                              }`}
                            >
                              <div className="whitespace-pre-wrap">{m.content}</div>
                              <div
                                className={`text-[10px] mt-1 opacity-60 ${
                                  isAssistant ? "text-muted-foreground" : "text-primary-foreground text-right"
                                }`}
                              >
                                {new Date(m.timestamp).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </div>

                            {!isAssistant && (
                              <div className="w-6 h-6 rounded-full bg-muted text-foreground flex items-center justify-center shrink-0 border">
                                <User className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
