"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, AlertCircle, Bot, CheckCircle2 } from "lucide-react";
import { registerCandidateAction } from "../actions";
import type { InterviewSessionData } from "../types";

interface CandidateRegistrationFormProps {
  job: {
    title: string;
    slug: string;
    organization: { name: string };
    maxTurns: number;
    generatedSpec: {
      roleSummary?: string;
      domainWeight?: number;
      implicitWeight?: number;
    };
  };
  onRegistered: (session: InterviewSessionData) => void;
}

export function CandidateRegistrationForm({
  job,
  onRegistered,
}: CandidateRegistrationFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [cvSummaryText, setCvSummaryText] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (fullName.trim().length < 2) {
      setErrorMessage("Nama lengkap wajib diisi minimal 2 karakter.");
      return;
    }
    if (!email.includes("@") || !email.includes(".")) {
      setErrorMessage("Format email tidak valid.");
      return;
    }
    if (cvSummaryText.trim().length < 10) {
      setErrorMessage("Ringkasan CV/pengalaman minimal 10 karakter.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await registerCandidateAction({
        jobSlug: job.slug,
        fullName,
        email,
        cvSummaryText,
        portfolioUrl: portfolioUrl.trim() || undefined,
      });

      if (res.success && res.session) {
        onRegistered(res.session);
      } else {
        setErrorMessage(res.error || "Gagal memulai sesi pendaftaran.");
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Terjadi kesalahan sistem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Card className="border-border shadow-lg">
        <CardHeader className="space-y-3 pb-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {job.organization.name}
            </span>
            <Badge variant="secondary" className="flex items-center gap-1 font-mono text-xs">
              <Bot className="w-3.5 h-3.5 text-primary" />
              {job.maxTurns} Pertanyaan Skenario
            </Badge>
          </div>
          <CardTitle className="text-3xl font-extrabold tracking-tight">
            {job.title}
          </CardTitle>
          {job.generatedSpec.roleSummary && (
            <CardDescription className="text-sm leading-relaxed pt-1">
              {job.generatedSpec.roleSummary}
            </CardDescription>
          )}

          {/* Quick info badges */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge variant="outline" className="text-xs">
              Fokus Teknis: {job.generatedSpec.domainWeight ?? 50}%
            </Badge>
            <Badge variant="outline" className="text-xs">
              Karakter & Etos: {job.generatedSpec.implicitWeight ?? 50}%
            </Badge>
            <Badge variant="outline" className="text-xs text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Langsung Diwawancarai AI
            </Badge>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            {errorMessage && (
              <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullname">Nama Lengkap</Label>
              <Input
                id="fullname"
                placeholder="Contoh: Budi Santoso"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Alamat Email Aktif</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Gunakan email yang sama jika ingin melanjutkan sesi sebelumnya.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cv-summary">Ringkasan Pengalaman / CV Singkat</Label>
              <Textarea
                id="cv-summary"
                rows={3}
                placeholder="Tulis ringkasan latar belakangmu, tools yang dikuasai, proyek yang pernah kamu buat, atau pengalaman organisasi..."
                value={cvSummaryText}
                onChange={(e) => setCvSummaryText(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="portfolio-url">Tautan Portofolio / GitHub / LinkedIn (Opsional)</Label>
              <Input
                id="portfolio-url"
                type="url"
                placeholder="https://github.com/username atau https://linkedin.com/in/..."
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button
              type="submit"
              size="lg"
              className="w-full font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Mempersiapkan Ruang Wawancara...
                </>
              ) : (
                <>
                  Mulai Wawancara AI Sekarang
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Wawancara berlangsung santai selama maksimal {job.maxTurns} giliran tanya-jawab.
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
