"use client";

import { useState, useTransition } from "react";
import {
  User,
  Mail,
  FileText,
  Code,
  Globe,
  Eye,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { CandidateProfileData } from "../types";
import { saveCandidateProfileAction } from "../actions";

interface CandidateProfileFormProps {
  initialProfile: CandidateProfileData;
}

export function CandidateProfileForm({ initialProfile }: CandidateProfileFormProps) {
  const [name, setName] = useState(initialProfile.name);
  const [cvSummaryText, setCvSummaryText] = useState(initialProfile.cvSummaryText);
  const [skillsText, setSkillsText] = useState(initialProfile.skills.join(", "));
  const [portfolioUrl, setPortfolioUrl] = useState(initialProfile.portfolioUrl || "");
  const [isOpenToPool, setIsOpenToPool] = useState(initialProfile.isOpenToPool);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );
  const [isPending, startTransition] = useTransition();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const parsedSkills = skillsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    startTransition(async () => {
      const res = await saveCandidateProfileAction({
        userId: initialProfile.userId,
        name,
        cvSummaryText,
        skills: parsedSkills,
        portfolioUrl: portfolioUrl || null,
        isOpenToPool,
      });

      if (res.success) {
        setMessage({
          type: "success",
          text: "Profil dan CV MatchLab Anda berhasil diperbarui!",
        });
      } else {
        setMessage({
          type: "error",
          text: res.error || "Gagal memperbarui profil.",
        });
      }
    });
  };

  return (
    <form onSubmit={handleSave}>
      <Card className="border border-border/80 shadow-xs">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Profil & CV MatchLab Terpadu
          </CardTitle>
          <CardDescription>
            Profil ini digunakan otomatis saat Anda melamar ke berbagai organisasi & lab riset di MatchLab tanpa harus mengisi ulang riwayat dari awal.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {message && (
            <div
              className={`p-3.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
                message.type === "success"
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                  : "bg-destructive/10 text-destructive border border-destructive/30"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Name & Email Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-semibold flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                Nama Lengkap
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="cth. Dewi Lestari"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                Alamat Email (Akun)
              </Label>
              <Input
                id="email"
                value={initialProfile.email}
                disabled
                className="bg-muted/50 cursor-not-allowed font-mono text-xs"
              />
            </div>
          </div>

          {/* CV Summary */}
          <div className="space-y-2">
            <Label htmlFor="cvSummary" className="text-xs font-semibold flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              Ringkasan CV & Pengalaman Relevan
            </Label>
            <Textarea
              id="cvSummary"
              rows={4}
              value={cvSummaryText}
              onChange={(e) => setCvSummaryText(e.target.value)}
              placeholder="Ceritakan latar belakang pendidikan, proyek teknis yang pernah Anda bangun, dan keahlian utama Anda..."
              className="text-sm leading-relaxed"
              required
            />
            <p className="text-[11px] text-muted-foreground">
              Ringkasan ini menjadi konteks awal AI Interviewer saat mempersonalisasi pertanyaan wawancara.
            </p>
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <Label htmlFor="skills" className="text-xs font-semibold flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-muted-foreground" />
              Keahlian Utama (Pisahkan dengan koma)
            </Label>
            <Input
              id="skills"
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              placeholder="cth. Next.js, TypeScript, PostgreSQL, Docker, Tailwind CSS"
            />
          </div>

          {/* Portfolio URL */}
          <div className="space-y-2">
            <Label htmlFor="portfolio" className="text-xs font-semibold flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-muted-foreground" />
              Tautan Portofolio / GitHub / LinkedIn
            </Label>
            <Input
              id="portfolio"
              type="url"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="https://github.com/username atau https://myportfolio.dev"
            />
          </div>

          {/* Talent Pool Opt-in Toggle */}
          <div className="p-4 rounded-xl border bg-muted/30 flex items-start gap-3">
            <input
              type="checkbox"
              id="isOpenToPool"
              checked={isOpenToPool}
              onChange={(e) => setIsOpenToPool(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-primary text-primary focus:ring-primary cursor-pointer"
            />
            <label htmlFor="isOpenToPool" className="text-xs space-y-1 cursor-pointer">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-primary" />
                Izinkan organisasi & lab lain menemukan profil saya di Talent Pool
              </span>
              <p className="text-muted-foreground">
                Jika diaktifkan, recruiter dan pimpinan lab yang terverifikasi dapat melihat keahlian Anda dan mengundang Anda ke proses wawancara.
              </p>
            </label>
          </div>
        </CardContent>

        <CardFooter className="border-t pt-4 flex justify-end">
          <Button type="submit" disabled={isPending} className="gap-1.5 text-xs">
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Simpan Perubahan Profil
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
