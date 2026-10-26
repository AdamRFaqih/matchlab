"use client";

import { useState, useTransition } from "react";
import {
  Building2,
  Sparkles,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Shield,
  Layers,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { updateOrganizationSettingsAction } from "../actions";
import type { OrganizationDashboardData } from "../types";

interface OrganizationSettingsFormProps {
  organization: OrganizationDashboardData["organization"];
  quota: OrganizationDashboardData["quota"];
  isOrgAdmin: boolean;
}

export function OrganizationSettingsForm({
  organization,
  quota,
  isOrgAdmin,
}: OrganizationSettingsFormProps) {
  const [name, setName] = useState(organization.name);
  const [cultureDescription, setCultureDescription] = useState(
    organization.cultureDescription || ""
  );
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );
  const [isPending, startTransition] = useTransition();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOrgAdmin) {
      setMessage({
        type: "error",
        text: "Hanya Org Admin yang memiliki hak akses untuk mengubah pengaturan organisasi.",
      });
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const res = await updateOrganizationSettingsAction({
        organizationId: organization.id,
        name,
        cultureDescription,
      });

      if (res.success) {
        setMessage({
          type: "success",
          text: "Pengaturan organisasi & Company Culture DNA berhasil diperbarui!",
        });
      } else {
        setMessage({
          type: "error",
          text: res.error || "Gagal memperbarui pengaturan.",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-xs gap-1")}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Dashboard Tim
        </Link>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="border border-border/80 shadow-xs">
          <CardHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Pengaturan Organisasi & Culture DNA
                </CardTitle>
                <CardDescription>
                  Kelola identitas tim dan Company Culture DNA yang menjadi rujukan AI dalam membuat rubrik dan menilai kandidat.
                </CardDescription>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {isOrgAdmin ? "Hak Akses: Org Admin" : "Hak Akses: Division Lead (Lihat Saja)"}
              </Badge>
            </div>
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

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orgName" className="text-xs font-semibold">
                  Nama Perusahaan / Organisasi
                </Label>
                <Input
                  id="orgName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isOrgAdmin}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="orgSlug" className="text-xs font-semibold">
                  Slug Tenant (URL)
                </Label>
                <Input
                  id="orgSlug"
                  value={organization.slug}
                  disabled
                  className="bg-muted/50 cursor-not-allowed font-mono text-xs"
                />
              </div>
            </div>

            {/* Company Culture DNA */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="cultureDescription"
                  className="text-xs font-semibold flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  Company Culture DNA (Disuntikkan ke AI)
                </Label>
              </div>
              <Textarea
                id="cultureDescription"
                rows={5}
                value={cultureDescription}
                onChange={(e) => setCultureDescription(e.target.value)}
                disabled={!isOrgAdmin}
                placeholder="cth. Tim kami menjunjung tinggi otonomi kerja, komunikasi asinkron yang jelas, rasa memiliki masalah (ownership), dan ketenangan menghadapi insiden sistem di saat genting..."
                className="text-sm leading-relaxed"
              />
              <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20 text-xs text-muted-foreground flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Mengapa Culture DNA penting?</strong> Deskripsi ini secara otomatis disuntikkan ke dalam prompt <em>AI Requirement Translator (Flow A)</em> dan <em>AI Matchmaker Evaluator (Flow C)</em>. AI akan menghasilkan pertanyaan skenario dan mengevaluasi respon kandidat agar selaras dengan etos kerja tim Anda.
                </span>
              </div>
            </div>

            {/* Subscription & Quota Card */}
            <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
              <div className="font-semibold text-xs flex items-center gap-1.5 text-foreground">
                <Layers className="w-4 h-4 text-primary" />
                Informasi Paket & Kuota Pelamar
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Paket Langganan:</span>
                  <div className="font-bold text-foreground mt-0.5">{organization.planTier}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Status Verifikasi:</span>
                  <div className="font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                    <Shield className="w-3.5 h-3.5" />
                    {organization.isVerified ? "Terverifikasi" : "Pending"}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Kuota:</span>
                  <div className="font-bold text-foreground font-mono mt-0.5">
                    {quota.total} pelamar
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Sisa Kuota:</span>
                  <div className="font-bold text-primary font-mono mt-0.5">
                    {quota.remaining} pelamar
                  </div>
                </div>
              </div>
            </div>
          </CardContent>

          {isOrgAdmin && (
            <CardFooter className="border-t pt-4 flex justify-end">
              <Button type="submit" disabled={isPending} className="gap-1.5 text-xs">
                {isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Simpan Perubahan
              </Button>
            </CardFooter>
          )}
        </Card>
      </form>
    </div>
  );
}
