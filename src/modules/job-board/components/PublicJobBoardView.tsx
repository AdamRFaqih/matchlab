"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Building2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Clock,
  Users,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import type { JobBoardData } from "../types";
import type { AuthUser } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

interface PublicJobBoardViewProps {
  initialData: JobBoardData;
  currentUser: AuthUser | null;
}

export function PublicJobBoardView({ initialData, currentUser }: PublicJobBoardViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<string>("ALL");

  const filteredJobs = initialData.jobs.filter((job) => {
    // Company filter
    if (selectedCompany !== "ALL" && job.organization.slug !== selectedCompany) {
      return false;
    }

    // Keyword filter
    const q = searchQuery.toLowerCase();
    const matchTitle = job.title.toLowerCase().includes(q);
    const matchSummary = job.roleSummary.toLowerCase().includes(q);
    const matchCompany = job.organization.name.toLowerCase().includes(q);
    const matchSkills = job.requiredSkills.some((s) => s.toLowerCase().includes(q));

    return matchTitle || matchSummary || matchCompany || matchSkills;
  });

  const isJobSeeker = currentUser?.systemRole === "JOB_SEEKER";

  return (
    <div className="space-y-6">
      {/* Job Seeker Profile Status Alert */}
      {isJobSeeker && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold">
                Masuk sebagai {currentUser.name} (Job Seeker)
              </p>
              <p className="text-xs text-muted-foreground">
                Profil MatchLab dan CV Anda akan otomatis terintegrasi saat melamar ke lowongan mana pun.
              </p>
            </div>
          </div>
          <Link
            href="/candidate/dashboard"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs shrink-0")}
          >
            Buka Portal Pelamar
          </Link>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-card p-4 rounded-xl border shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari posisi, kata kunci teknologi (Docker, Next.js, Python)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-sm"
          />
        </div>
        <div className="sm:w-64">
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="ALL">Semua Perusahaan / Lab</option>
            {initialData.companies.map((company) => (
              <option key={company.id} value={company.slug}>
                {company.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>Menampilkan {filteredJobs.length} lowongan aktif terverifikasi</span>
      </div>

      {/* Job Cards Grid */}
      {filteredJobs.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed bg-muted/20 space-y-3">
          <Building2 className="w-10 h-10 mx-auto text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Tidak Ada Lowongan yang Sesuai</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Coba ubah kata kunci pencarian atau pilih perusahaan lain untuk melihat peluang yang tersedia.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredJobs.map((job) => (
            <Card
              key={job.id}
              className="flex flex-col justify-between border hover:border-primary/50 transition-all shadow-xs hover:shadow-md"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-1">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{job.organization.name}</span>
                      {job.organization.isVerified && (
                        <span title="Organisasi Terverifikasi">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-lg font-bold leading-tight">
                      {job.title}
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="text-[11px] shrink-0 font-normal">
                    {job.maxTurns} Giliran AI
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 text-sm text-muted-foreground pb-4">
                <p className="text-foreground/90 line-clamp-2 text-xs leading-relaxed">
                  {job.roleSummary}
                </p>

                {job.organization.cultureDescription && (
                  <div className="p-2.5 rounded-lg bg-muted/40 border text-[11px] italic text-muted-foreground line-clamp-2">
                    <span className="font-semibold not-italic text-foreground/80">Kultur Tim: </span>
                    &ldquo;{job.organization.cultureDescription}&rdquo;
                  </div>
                )}

                {job.requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {job.requiredSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {job.applicantCount} pelamar terdaftar
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Interview instan 24/7
                  </span>
                </div>
              </CardContent>

              <CardFooter className="border-t pt-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Penyaringan Awal AI Otomatis
                </span>
                <Link
                  href={`/apply/${job.slug}`}
                  className={cn(
                    buttonVariants({ size: "sm" }),
                    "text-xs font-semibold gap-1.5 shadow-xs"
                  )}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Apply with MatchLab Profile
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
