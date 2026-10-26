"use client";

import { useState, useTransition } from "react";
import {
  Users,
  UserPlus,
  Mail,
  Trash2,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  Clock,
} from "lucide-react";
import type { OrgRole } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  inviteMemberAction,
  revokeInvitationAction,
  changeMemberRoleAction,
  removeMemberAction,
} from "../actions";

interface TeamMemberItem {
  id: string;
  orgRole: OrgRole;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    lastLoginAt: Date | null;
    isActive: boolean;
  };
}

interface TeamInvitationItem {
  id: string;
  email: string;
  orgRole: OrgRole;
  expiresAt: Date;
  createdAt: Date;
  invitedBy: {
    name: string;
  } | null;
}

interface TeamManagementViewProps {
  currentUserId: string;
  organizationName: string;
  members: TeamMemberItem[];
  invitations: TeamInvitationItem[];
  maxMembers: number | null;
}

export function TeamManagementView({
  currentUserId,
  organizationName,
  members,
  invitations,
  maxMembers,
}: TeamManagementViewProps) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<OrgRole>("DIVISION_LEAD");
  const [manualInviteUrl, setManualInviteUrl] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );
  const [isPending, startTransition] = useTransition();

  const totalSeats = members.length + invitations.length;
  const isLimitReached = maxMembers !== null && totalSeats >= maxMembers;

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setManualInviteUrl(null);

    startTransition(async () => {
      const res = await inviteMemberAction({
        email: inviteEmail,
        orgRole: inviteRole,
      });

      if (res.success) {
        setInviteEmail("");
        if (res.inviteUrl) {
          setManualInviteUrl(res.inviteUrl);
          setStatusMessage({
            type: "success",
            text: "Undangan dibuat! Karena RESEND_API_KEY belum dikonfigurasi, salin tautan undangan di bawah untuk dikirimkan secara manual.",
          });
        } else {
          setStatusMessage({
            type: "success",
            text: `Email undangan berhasil dikirimkan ke ${inviteEmail}.`,
          });
        }
      } else {
        setStatusMessage({
          type: "error",
          text: res.error || "Gagal mengirim undangan.",
        });
      }
    });
  };

  const handleCopyInviteUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleChangeRole = (memberId: string, role: OrgRole) => {
    startTransition(async () => {
      const res = await changeMemberRoleAction(memberId, role);
      if (!res.success) {
        setStatusMessage({ type: "error", text: res.error || "Gagal mengubah peran." });
      }
    });
  };

  const handleRemoveMember = (memberId: string, name: string) => {
    if (confirm(`Yakin ingin mengeluarkan "${name}" dari tim organisasi?`)) {
      startTransition(async () => {
        const res = await removeMemberAction(memberId);
        if (!res.success) {
          setStatusMessage({ type: "error", text: res.error || "Gagal menghapus anggota." });
        }
      });
    }
  };

  const handleRevokeInvite = (invitationId: string) => {
    if (confirm("Batalkan undangan ini?")) {
      startTransition(async () => {
        const res = await revokeInvitationAction(invitationId);
        if (!res.success) {
          setStatusMessage({ type: "error", text: res.error || "Gagal membatalkan undangan." });
        }
      });
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manajemen Tim</h1>
        <p className="text-sm text-muted-foreground">
          Kelola anggota tim, pembagian peran akses, dan undangan di {organizationName}.
        </p>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 text-sm ${
            statusMessage.type === "success"
              ? "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300"
              : "bg-destructive/10 border-destructive/20 text-destructive"
          }`}
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-2 flex-1">
            <p>{statusMessage.text}</p>
            {manualInviteUrl && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  readOnly
                  value={manualInviteUrl}
                  className="text-xs px-3 py-1.5 rounded-lg border bg-background font-mono w-full max-w-lg"
                />
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() => handleCopyInviteUrl(manualInviteUrl)}
                  className="gap-1 shrink-0"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedUrl ? "Tersalin" : "Salin Tautan"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 1. Invite New Member */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary" />
            Undang Rekan Kerja Baru
          </CardTitle>
          <CardDescription className="text-xs">
            Kandidat undangan akan menerima tautan akses untuk bergabung ke organisasi ini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="space-y-1.5 flex-1 w-full">
              <Label htmlFor="inviteEmail" className="text-xs">
                Email Rekan Kerja
              </Label>
              <Input
                id="inviteEmail"
                type="email"
                required
                placeholder="nama@organisasi.id"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                disabled={isPending || isLimitReached}
              />
            </div>

            <div className="space-y-1.5 w-full sm:w-48">
              <Label htmlFor="inviteRole" className="text-xs">
                Peran (Role)
              </Label>
              <select
                id="inviteRole"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as OrgRole)}
                disabled={isPending || isLimitReached}
                className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs font-medium"
              >
                <option value="DIVISION_LEAD">Division Lead</option>
                <option value="ORG_ADMIN">Org Admin</option>
              </select>
            </div>

            <Button
              type="submit"
              disabled={isPending || isLimitReached}
              className="gap-2 shrink-0 w-full sm:w-auto h-8 text-xs"
            >
              {isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Mail className="w-3.5 h-3.5" />
              )}
              Kirim Undangan
            </Button>
          </form>

          {isLimitReached && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-3">
              Batas kuota anggota paket Anda ({maxMembers} kursi) telah tercapai. Upgrade ke SME Pro untuk kursi tanpa batas.
            </p>
          )}
        </CardContent>
      </Card>

      {/* 2. Current Members Table */}
      <Card className="rounded-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Anggota Aktif ({members.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Daftar rekan kerja yang saat ini memiliki akses ke lowongan dan evaluasi organisasi ini.
              </CardDescription>
            </div>
            {maxMembers !== null && (
              <Badge variant="outline" className="text-xs">
                {totalSeats} / {maxMembers} Kursi Terpakai
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y text-xs">
            {members.map((member) => {
              const isCurrentUser = member.user.id === currentUserId;

              return (
                <div
                  key={member.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
                      {member.user.name[0]?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground flex items-center gap-2">
                        <span>{member.user.name}</span>
                        {isCurrentUser && (
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-primary/10 text-primary font-semibold">
                            Anda
                          </span>
                        )}
                      </div>
                      <div className="text-muted-foreground text-[11px]">
                        {member.user.email} • Terakhir aktif:{" "}
                        {member.user.lastLoginAt
                          ? new Date(member.user.lastLoginAt).toLocaleDateString("id-ID")
                          : "Belum login"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <select
                      value={member.orgRole}
                      onChange={(e) => handleChangeRole(member.id, e.target.value as OrgRole)}
                      disabled={isPending || isCurrentUser}
                      className="h-7 px-2 rounded-md border border-border bg-background text-[11px] font-medium"
                    >
                      <option value="DIVISION_LEAD">Division Lead</option>
                      <option value="ORG_ADMIN">Org Admin</option>
                    </select>

                    {!isCurrentUser && (
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        onClick={() => handleRemoveMember(member.id, member.user.name)}
                        disabled={isPending}
                        className="text-muted-foreground hover:text-destructive"
                        title="Hapus dari organisasi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 3. Pending Invitations Table */}
      {invitations.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Undangan Menunggu ({invitations.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Undangan yang belum diterima oleh penerima.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y text-xs">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-semibold text-foreground flex items-center gap-2">
                      <span>{inv.email}</span>
                      <Badge variant="secondary" className="text-[10px] py-0 font-normal">
                        {inv.orgRole === "ORG_ADMIN" ? "Org Admin" : "Division Lead"}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground text-[11px]">
                      Diundang oleh {inv.invitedBy?.name || "Admin"} • Berlaku hingga{" "}
                      {new Date(inv.expiresAt).toLocaleDateString("id-ID")}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRevokeInvite(inv.id)}
                    disabled={isPending}
                    className="h-7 text-xs text-destructive hover:bg-destructive/10"
                  >
                    Batalkan
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
