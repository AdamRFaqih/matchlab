"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles,
  Trophy,
  Plus,
  Trash2,
  Copy,
  Check,
  Sliders,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import {
  translateRequirementsAction,
  saveJobRequisitionAction,
} from "../actions";
import type { ScoringRubric } from "../types";

const SAMPLE_PROMPTS = [
  {
    title: "Asisten Lab DevOps & Server",
    prompt:
      "Butuh asisten lab yang ngerti dasar Docker & Linux, terbiasa terminal, punya inisiatif tinggi buat troubleshooting server, dan gak gampang hilang atau ngilang pas minggu ujian semester.",
  },
  {
    title: "Frontend Developer UKM Web",
    prompt:
      "Mencari frontend dev yang paham dasar Next.js/React dan Tailwind CSS. Paling penting komunikasinya asinkron aktif, rapi bikin pull request di GitHub, dan bertanggung jawab terhadap deadline rilis.",
  },
  {
    title: "Staff Riset AI & Data Lab",
    prompt:
      "Perlu anggota tim riset yang terbiasa pakai Python dan dasar PyTorch/HuggingFace. Orangnya jujur, gak halusinasi pas eksperimen gagal, dan mau mendokumentasikan log eksperimen secara disiplin.",
  },
];

interface JobRequisitionFormProps {
  organizationId?: string;
  organizationName?: string;
}

export function JobRequisitionForm({
  organizationId,
  organizationName,
}: JobRequisitionFormProps = {}) {
  const [title, setTitle] = useState("");
  const [rawPrompt, setRawPrompt] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [rubric, setRubric] = useState<ScoringRubric | null>(null);
  const [maxTurns, setMaxTurns] = useState<number>(8);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState<{
    jobId: string;
    slug: string;
    shareableUrl: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Handle AI Translation
  const handleTranslate = async () => {
    if (rawPrompt.trim().length < 10) {
      setErrorMessage("Deskripsi kebutuhan minimal 10 karakter.");
      return;
    }
    setErrorMessage(null);
    setIsTranslating(true);

    try {
      const res = await translateRequirementsAction(rawPrompt, organizationId);
      if (res.success && res.rubric) {
        setRubric(res.rubric);
        if (!title.trim()) {
          // Derive a quick initial title if blank
          setTitle(SAMPLE_PROMPTS.find((s) => s.prompt === rawPrompt)?.title || "Posisi Baru");
        }
      } else {
        setErrorMessage(res.error || "Gagal menerjemahkan kebutuhan.");
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Terjadi kesalahan sistem.");
    } finally {
      setIsTranslating(false);
    }
  };

  // Handle Weight adjustment with auto-balance
  const handleDomainWeightChange = (newDomainWeight: number) => {
    const clampedDomain = Math.min(Math.max(newDomainWeight, 10), 90);
    const implicit = 100 - clampedDomain;
    if (rubric) {
      setRubric({
        ...rubric,
        domainWeight: clampedDomain,
        implicitWeight: implicit,
      });
    }
  };

  // Modify Domain Criteria
  const handleDomainCriteriaChange = (
    index: number,
    field: "topic" | "expectedDepth" | "probeQuestion",
    val: string
  ) => {
    if (!rubric) return;
    const updated = [...rubric.domainCriteria];
    updated[index] = { ...updated[index], [field]: val };
    setRubric({ ...rubric, domainCriteria: updated });
  };

  const addDomainCriteria = () => {
    if (!rubric || rubric.domainCriteria.length >= 4) return;
    setRubric({
      ...rubric,
      domainCriteria: [
        ...rubric.domainCriteria,
        {
          topic: "Topik Teknis Tambahan",
          expectedDepth: "Deskripsi ekspektasi jawaban yang solid.",
          probeQuestion: "Pertanyaan skenario praktis...",
        },
      ],
    });
  };

  const removeDomainCriteria = (index: number) => {
    if (!rubric || rubric.domainCriteria.length <= 2) return;
    setRubric({
      ...rubric,
      domainCriteria: rubric.domainCriteria.filter((_, i) => i !== index),
    });
  };

  // Modify Implicit Criteria
  const handleImplicitCriteriaChange = (
    index: number,
    field: "traitName" | "situationalDilemma",
    val: string
  ) => {
    if (!rubric) return;
    const updated = [...rubric.implicitCriteria];
    updated[index] = { ...updated[index], [field]: val };
    setRubric({ ...rubric, implicitCriteria: updated });
  };

  const addImplicitCriteria = () => {
    if (!rubric || rubric.implicitCriteria.length >= 4) return;
    setRubric({
      ...rubric,
      implicitCriteria: [
        ...rubric.implicitCriteria,
        {
          traitName: "Karakter/Habit Tambahan",
          positiveIndicators: ["Proaktif dan bertanggung jawab"],
          redFlagIndicators: ["Menghilang tanpa kabar"],
          situationalDilemma: "Bagaimana responmu saat...",
        },
      ],
    });
  };

  const removeImplicitCriteria = (index: number) => {
    if (!rubric || rubric.implicitCriteria.length <= 2) return;
    setRubric({
      ...rubric,
      implicitCriteria: rubric.implicitCriteria.filter((_, i) => i !== index),
    });
  };

  // Save Job Requisition
  const handleSaveRequisition = async () => {
    if (!title.trim()) {
      setErrorMessage("Judul posisi wajib diisi.");
      return;
    }
    if (!rubric) {
      setErrorMessage("Silakan terjemahkan kebutuhan dengan AI terlebih dahulu.");
      return;
    }

    setErrorMessage(null);
    setIsSaving(true);

    try {
      const res = await saveJobRequisitionAction({
        organizationId,
        title,
        rawUserPrompt: rawPrompt,
        scoringRubric: rubric,
        maxTurns,
      });

      if (res.success && res.slug && res.jobId) {
        setSavedSuccess({
          jobId: res.jobId,
          slug: res.slug,
          shareableUrl: res.shareableUrl || `/apply/${res.slug}`,
        });
      } else {
        setErrorMessage(res.error || "Gagal menyimpan job requisition.");
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyLink = () => {
    if (!savedSuccess) return;
    const fullUrl = window.location.origin + savedSuccess.shareableUrl;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-4">
      {/* Success banner after saving */}
      {savedSuccess && (
        <Card className="border-emerald-500/50 bg-emerald-500/10">
          <CardHeader>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
              <CardTitle>Job Requisition Berhasil Dipublikasikan!</CardTitle>
            </div>
            <CardDescription className="text-emerald-700 dark:text-emerald-300">
              Kandidat sekarang dapat mengakses ruang wawancara AI melalui tautan publik di bawah.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <div className="flex-1 w-full bg-background border px-3 py-2 rounded-md font-mono text-sm break-all">
                {typeof window !== "undefined" ? window.location.origin : ""}
                {savedSuccess.shareableUrl}
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button onClick={handleCopyLink} variant="default" className="flex-1 sm:flex-initial">
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-1" /> Disalin
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" /> Salin Link
                    </>
                  )}
                </Button>
                <a
                  href={savedSuccess.shareableUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
                >
                  <ExternalLink className="w-4 h-4 mr-1" /> Buka
                </a>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-emerald-500/20 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSavedSuccess(null);
                setRubric(null);
                setRawPrompt("");
                setTitle("");
              }}
            >
              Buat Posisi Baru Lagi
            </Button>

            <Link
              href={`/dashboard/jobs/${savedSuccess.jobId}`}
              className={cn(
                buttonVariants({ size: "sm" }),
                "bg-emerald-600 hover:bg-emerald-700 text-white"
              )}
            >
              <Trophy className="w-4 h-4 mr-1.5" /> Buka Leaderboard Posisi Ini
            </Link>
          </CardFooter>
        </Card>
      )}

      {/* Main Creation Card */}
      {!savedSuccess && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-primary" />
                  AI Requirement Translator (Flow A)
                </CardTitle>
                {organizationName && (
                  <Badge variant="outline" className="text-xs">
                    {organizationName}
                  </Badge>
                )}
              </div>
              <CardDescription>
                Tulis kebutuhan kandidat dengan bahasa Indonesia santai. AI MatchLab akan merumuskannya menjadi
                rubrik penilaian objektif dan pertanyaan skenario untuk wawancara 8-turn.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {errorMessage && (
                <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Title Input */}
              <div className="space-y-2">
                <Label htmlFor="job-title" className="text-sm font-semibold">
                  Judul Posisi / Divisi
                </Label>
                <Input
                  id="job-title"
                  placeholder="Contoh: Asisten Lab DevOps & Infrastruktur Linux"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Casual Prompt Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="raw-prompt" className="text-sm font-semibold">
                    Kebutuhan Kandidat (Bahasa Santai)
                  </Label>
                  <span className="text-xs text-muted-foreground">Minimal 10 karakter</span>
                </div>
                <Textarea
                  id="raw-prompt"
                  rows={4}
                  placeholder="Ceritakan siapa yang kamu butuhkan, ekspektasi teknis, dan kebiasaan yang kamu cari atau hindari..."
                  value={rawPrompt}
                  onChange={(e) => setRawPrompt(e.target.value)}
                />

                {/* Sample prompt chips */}
                <div className="pt-1">
                  <span className="text-xs text-muted-foreground mr-2 font-medium">Contoh Cepat:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {SAMPLE_PROMPTS.map((sample, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setTitle(sample.title);
                          setRawPrompt(sample.prompt);
                        }}
                        className="text-xs border rounded-full px-2.5 py-1 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {sample.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <Button
                type="button"
                onClick={handleTranslate}
                disabled={isTranslating || rawPrompt.trim().length < 10}
                className="w-full sm:w-auto"
              >
                {isTranslating ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Sedang Menganalisis Kebutuhan...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Scoring Rubric dengan AI
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Generated Rubric Review & Customization */}
          {rubric && (
            <Card className="border-primary/20 shadow-sm">
              <CardHeader className="bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-primary" />
                      Review & Kustomisasi Scoring Rubric
                    </CardTitle>
                    <CardDescription>
                      Atur bobot kompetensi dan sesuaikan pertanyaan skenario sebelum mempublikasikan ke kandidat.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    Interview Max {maxTurns} Turns
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 pt-6">
                {/* Role Summary */}
                <div className="space-y-2">
                  <Label htmlFor="role-summary" className="text-sm font-semibold">
                    Ringkasan Posisi (Dilihat oleh Kandidat)
                  </Label>
                  <Textarea
                    id="role-summary"
                    rows={2}
                    value={rubric.roleSummary}
                    onChange={(e) => setRubric({ ...rubric, roleSummary: e.target.value })}
                  />
                </div>

                {/* Weight Sliders */}
                <div className="p-4 rounded-lg bg-muted/40 space-y-4 border">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">Distribusi Bobot Penilaian (Harus 100%)</span>
                    <span className="text-xs font-mono text-muted-foreground">
                      Teknis: {rubric.domainWeight}% | Karakter: {rubric.implicitWeight}%
                    </span>
                  </div>

                  {/* Dual progress bar */}
                  <div className="w-full h-3 bg-secondary rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${rubric.domainWeight}%` }}
                      className="bg-primary transition-all duration-200"
                    />
                    <div
                      style={{ width: `${rubric.implicitWeight}%` }}
                      className="bg-emerald-600 transition-all duration-200"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1">
                      <Label htmlFor="domain-weight-input" className="text-xs text-muted-foreground">
                        Bobot Domain / Teknis ({rubric.domainWeight}%)
                      </Label>
                      <input
                        id="domain-weight-input"
                        type="range"
                        min="10"
                        max="90"
                        step="5"
                        value={rubric.domainWeight}
                        onChange={(e) => handleDomainWeightChange(parseInt(e.target.value, 10))}
                        className="w-full accent-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="implicit-weight-input" className="text-xs text-muted-foreground">
                        Bobot Karakter / Implicit Habits ({rubric.implicitWeight}%)
                      </Label>
                      <input
                        id="implicit-weight-input"
                        type="range"
                        min="10"
                        max="90"
                        step="5"
                        value={rubric.implicitWeight}
                        onChange={(e) => handleDomainWeightChange(100 - parseInt(e.target.value, 10))}
                        className="w-full accent-emerald-600"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Domain Criteria (Explicit) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-base">Kriteria Domain / Teknis ({rubric.domainCriteria.length})</h3>
                      <p className="text-xs text-muted-foreground">
                        Diuji pada giliran awal wawancara menggunakan studi kasus realistis.
                      </p>
                    </div>
                    {rubric.domainCriteria.length < 4 && (
                      <Button size="sm" variant="outline" onClick={addDomainCriteria}>
                        <Plus className="w-4 h-4 mr-1" /> Tambah
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {rubric.domainCriteria.map((item, idx) => (
                      <div key={idx} className="p-4 border rounded-md bg-card space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <Input
                            value={item.topic}
                            onChange={(e) => handleDomainCriteriaChange(idx, "topic", e.target.value)}
                            className="font-semibold text-sm max-w-sm"
                            placeholder="Nama Topik Keterampilan"
                          />
                          {rubric.domainCriteria.length > 2 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeDomainCriteria(idx)}
                              className="text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Ekspektasi Kedalaman Jawaban</Label>
                          <Textarea
                            rows={2}
                            value={item.expectedDepth}
                            onChange={(e) => handleDomainCriteriaChange(idx, "expectedDepth", e.target.value)}
                            placeholder="Apa yang membedakan kandidat yang paham dengan yang dangkal..."
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            Pertanyaan Skenario Interview (Probe Question)
                          </Label>
                          <Textarea
                            rows={2}
                            value={item.probeQuestion}
                            onChange={(e) => handleDomainCriteriaChange(idx, "probeQuestion", e.target.value)}
                            placeholder="Pertanyaan skenario yang akan diajukan AI Interviewer..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Implicit Criteria (Behavioral) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-base">
                        Kriteria Karakter / Implicit Habits ({rubric.implicitCriteria.length})
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Diuji menggunakan dilema situasional untuk melihat kebiasaan nyata kandidat di bawah tekanan.
                      </p>
                    </div>
                    {rubric.implicitCriteria.length < 4 && (
                      <Button size="sm" variant="outline" onClick={addImplicitCriteria}>
                        <Plus className="w-4 h-4 mr-1" /> Tambah
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {rubric.implicitCriteria.map((item, idx) => (
                      <div key={idx} className="p-4 border rounded-md bg-card space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <Input
                            value={item.traitName}
                            onChange={(e) => handleImplicitCriteriaChange(idx, "traitName", e.target.value)}
                            className="font-semibold text-sm max-w-sm"
                            placeholder="Nama Karakter / Trait"
                          />
                          {rubric.implicitCriteria.length > 2 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeImplicitCriteria(idx)}
                              className="text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        {/* Indicators list */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          <div className="space-y-1">
                            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                              Indikator Positif:
                            </span>
                            <ul className="text-xs space-y-1 list-disc list-inside text-muted-foreground">
                              {item.positiveIndicators.map((ind, i) => (
                                <li key={i}>{ind}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="space-y-1">
                            <span className="text-xs font-medium text-destructive">Indikator Red Flag:</span>
                            <ul className="text-xs space-y-1 list-disc list-inside text-muted-foreground">
                              {item.redFlagIndicators.map((rf, i) => (
                                <li key={i}>{rf}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            Pertanyaan Dilema Situasional (Dilemma Question)
                          </Label>
                          <Textarea
                            rows={2}
                            value={item.situationalDilemma}
                            onChange={(e) =>
                              handleImplicitCriteriaChange(idx, "situationalDilemma", e.target.value)
                            }
                            placeholder="Dilema situasi nyata untuk menguji respon kandidat..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Max turns setting */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="max-turns-select" className="text-sm font-semibold">
                      Batas Giliran Interview (Turn Limit)
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Maksimal percakapan tanya-jawab sebelum sesi otomatis terkunci dan dinilai.
                    </p>
                  </div>
                  <select
                    id="max-turns-select"
                    value={maxTurns}
                    onChange={(e) => setMaxTurns(parseInt(e.target.value, 10))}
                    className="border rounded-md px-3 py-1.5 text-sm bg-background"
                  >
                    <option value={6}>6 Giliran (Singkat)</option>
                    <option value={8}>8 Giliran (Standar PRD)</option>
                    <option value={10}>10 Giliran (Mendalam)</option>
                  </select>
                </div>
              </CardContent>

              <CardFooter className="flex justify-end gap-3 bg-muted/20 border-t py-4">
                <Button
                  variant="default"
                  size="lg"
                  onClick={handleSaveRequisition}
                  disabled={isSaving}
                  className="font-semibold"
                >
                  {isSaving ? "Menyimpan Requisition..." : "Simpan & Publikasikan Job"}
                </Button>
              </CardFooter>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
