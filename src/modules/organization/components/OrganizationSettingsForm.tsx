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
  Mail,
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
  const [billingEmail, setBillingEmail] = useState(organization.billingEmail || "");
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
        billingEmail,
        cultureDescription,
      });

      if (res.success) {
        setMessage({
          type: "success",
          text: "Pengaturan organisasi berhasil disimpan ke database.",
        });
      } else {
        setMessage({
          type: "error",
          text: res.error || "Terjadi kesalahan saat menyimpan pengaturan.",
        });
      }
    });
  };

  const planLabel =
    organization.planTier === "SME_PRO"
      ? "SME Pro Plan"
      : organization.planTier === "PAY_PER_OPREC"
      ? "Pay-per-Oprec"
      : "Free Starter Plan";

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1 text-muted-foreground")}
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pengaturan Organisasi</h1>
            <p className="text-sm text-muted-foreground">
              Konfigurasi identitas lab/organisasi, billing email, dan kultur evaluasi AI
            </p>
          </div>
        </div>

        <Badge variant={organization.isVerified ? "default" : "secondary"} className="gap-1.5 py-1">
          <Shield className="w-3.5 h-3.5" />
          {organization.isVerified ? "Terverifikasi" : "Belum Terverifikasi"}
        </Badge>
      </div>

      {message && (
        <div
          className={cn(
            "p-3.5 rounded-lg border flex items-center gap-2.5 text-sm",
            message.type === "success"
              ? "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300"
              : "bg-destructive/10 border-destructive/20 text-destructive"
          )}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              Identitas Organisasi
            </CardTitle>
            <CardDescription className="text-xs">
              Nama dan alamat URL publik untuk job board dan apply link organisasi Anda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="orgName">Nama Organisasi / Lab</Label>
                <Input
                  id="orgName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isOrgAdmin || isPending}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="orgSlug">Slug URL Organisasi</Label>
                <Input
                  id="orgSlug"
                  value={organization.slug}
                  disabled
                  className="bg-muted font-mono text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  Slug bersifat permanen untuk menjaga integritas tautan pelamar.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="billingEmail" className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                Email Tagihan (Billing)
              </Label>
              <Input
                id="billingEmail"
                type="email"
                placeholder="billing@organisasi.id"
                value={billingEmail}
                onChange={(e) => setBillingEmail(e.target.value)}
                disabled={!isOrgAdmin || isPending}
              />
              <p className="text-[11px] text-muted-foreground">
                Kuitansi pembayaran Midtrans dan notifikasi invoice akan dikirim ke alamat ini.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Profil Kultur & Evaluasi AI
            </CardTitle>
            <CardDescription className="text-xs">
              Deskripsi nilai-nilai kerja, etos tim, atau aturan lab yang dijadikan dasar penilaian implicit behavior oleh AI Interviewer & Evaluator
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="cultureDescription">Deskripsi Kultur Tim / Lab</Label>
            <Textarea
              id="cultureDescription"
              rows={4}
              value={cultureDescription}
              onChange={(e) => setCultureDescription(e.target.value)}
              disabled={!isOrgAdmin || isPending}
              placeholder="Contoh: Kami mengutamakan integritas riset, transparansi status pengerjaan, inisiatif mandiri, dan tanggung jawab tinggi saat minggu sibuk..."
              className="resize-y"
            />
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Paket & Kuota Pelamar
            </CardTitle>
            <CardDescription className="text-xs">
              Informasi paket langganan dan konsumsi kuota pelamar organisasi Anda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm py-1 border-b">
              <span className="text-muted-foreground">Paket Aktif:</span>
              <span className="font-semibold text-foreground">{planLabel}</span>
            </div>
            <div className="flex items-center justify-between text-sm py-1 border-b">
              <span className="text-muted-foreground">Kuota Terpakai / Total:</span>
              <span className="font-semibold text-foreground">
                {quota.used} / {quota.total} pelamar ({quota.percentage}%)
              </span>
            </div>
            <div className="flex items-center justify-between text-sm py-1">
              <span className="text-muted-foreground">Sisa Kuota:</span>
              <span className="font-semibold text-primary">{quota.remaining} pelamar</span>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/30 border-t pt-3 flex justify-between items-center text-xs text-muted-foreground">
            <span>Perlu menambah kuota pelamar?</span>
            <Link
              href="/dashboard/billing"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs")}
            >
              Kelola Paket di Halaman Billing →
            </Link>
          </CardFooter>
        </Card>

        {isOrgAdmin && (
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isPending} className="gap-2">
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Simpan Perubahan
                </>
              )}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
