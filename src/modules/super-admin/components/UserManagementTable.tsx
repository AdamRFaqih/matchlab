"use client";

import { useState, useTransition } from "react";
import type { SystemRole } from "@prisma/client";
import {
  Users,
  Search,
  UserCheck,
  UserX,
  Loader2,
  Shield,
  Briefcase,
  GraduationCap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { UserItem } from "../types";
import { toggleUserStatusAction } from "../actions";

interface UserManagementTableProps {
  initialUsers: UserItem[];
}

export function UserManagementTable({ initialUsers }: UserManagementTableProps) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | SystemRole>("ALL");
  const [, startTransition] = useTransition();
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const filteredUsers = users.filter((u) => {
    // Role filter
    if (roleFilter !== "ALL" && u.systemRole !== roleFilter) {
      return false;
    }

    // Search query
    const q = searchQuery.toLowerCase();
    const matchesBasic =
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchesSkills = u.skills.some((skill) => skill.toLowerCase().includes(q));
    const matchesOrg = u.organizations.some((org) =>
      org.name.toLowerCase().includes(q)
    );

    return matchesBasic || matchesSkills || matchesOrg;
  });

  const handleToggleStatus = (userId: string, currentStatus: boolean) => {
    setActionInProgress(userId);
    startTransition(async () => {
      const nextStatus = !currentStatus;
      const res = await toggleUserStatusAction(userId, nextStatus);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isActive: nextStatus } : u))
        );
      }
      setActionInProgress(null);
    });
  };

  const getRoleBadge = (role: SystemRole) => {
    switch (role) {
      case "SUPER_ADMIN":
        return (
          <Badge
            variant="default"
            className="bg-purple-600 hover:bg-purple-600/90 text-white flex items-center gap-1"
          >
            <Shield className="w-3 h-3" />
            Super Admin
          </Badge>
        );
      case "COMPANY_USER":
        return (
          <Badge
            variant="default"
            className="bg-blue-600 hover:bg-blue-600/90 text-white flex items-center gap-1"
          >
            <Briefcase className="w-3 h-3" />
            Company User
          </Badge>
        );
      case "JOB_SEEKER":
        return (
          <Badge
            variant="default"
            className="bg-emerald-600 hover:bg-emerald-600/90 text-white flex items-center gap-1"
          >
            <GraduationCap className="w-3 h-3" />
            Job Seeker
          </Badge>
        );
    }
  };

  return (
    <Card className="border border-border/80 shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Manajemen Pengguna & Job Seeker
          </CardTitle>
          <CardDescription>
            Lihat daftar seluruh aktor platform, filter berdasarkan peran, dan moderasi akun aktif/ditangguhkan.
          </CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Role Filter Tabs */}
          <div className="flex rounded-lg border bg-muted/30 p-0.5 text-xs">
            <button
              onClick={() => setRoleFilter("ALL")}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                roleFilter === "ALL"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setRoleFilter("SUPER_ADMIN")}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                roleFilter === "SUPER_ADMIN"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Super Admin
            </button>
            <button
              onClick={() => setRoleFilter("COMPANY_USER")}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                roleFilter === "COMPANY_USER"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Company User
            </button>
            <button
              onClick={() => setRoleFilter("JOB_SEEKER")}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                roleFilter === "JOB_SEEKER"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Job Seeker
            </button>
          </div>

          <div className="relative w-full sm:w-56">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama, email, skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-sm h-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="py-3 px-4">Nama & Email</th>
                <th className="py-3 px-4">Peran Sistem</th>
                <th className="py-3 px-4">Afiliasi / Profil Keahlian</th>
                <th className="py-3 px-4">Status Akun</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground text-sm">
                    Tidak ada pengguna yang sesuai dengan filter atau kata kunci.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isProcessing = actionInProgress === user.id;

                  return (
                    <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                      {/* Name & Email */}
                      <td className="py-3 px-4 align-top">
                        <div className="font-semibold text-foreground">{user.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {user.email}
                        </div>
                      </td>

                      {/* System Role */}
                      <td className="py-3 px-4 align-top">
                        {getRoleBadge(user.systemRole)}
                      </td>

                      {/* Organizations or Candidate Skills */}
                      <td className="py-3 px-4 align-top max-w-xs">
                        {user.organizations.length > 0 ? (
                          <div className="space-y-1">
                            {user.organizations.map((org, idx) => (
                              <div
                                key={idx}
                                className="text-xs flex items-center gap-1.5 text-foreground"
                              >
                                <span className="font-medium">{org.name}</span>
                                <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                                  {org.orgRole}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : user.skills.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {user.skills.map((skill, sIdx) => (
                              <span
                                key={sIdx}
                                className="inline-block bg-muted text-muted-foreground text-[10px] px-1.5 py-0.5 rounded font-medium"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            {user.systemRole === "SUPER_ADMIN"
                              ? "Akses Global Seluruh Platform"
                              : "Belum melengkapi keahlian"}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 align-top">
                        {user.isActive ? (
                          <Badge
                            variant="outline"
                            className="text-emerald-600 border-emerald-500/30 bg-emerald-500/5 font-medium flex items-center gap-1"
                          >
                            <UserCheck className="w-3 h-3" />
                            Aktif
                          </Badge>
                        ) : (
                          <Badge
                            variant="destructive"
                            className="font-medium flex items-center gap-1"
                          >
                            <UserX className="w-3 h-3" />
                            Ditangguhkan
                          </Badge>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 align-top text-right whitespace-nowrap">
                        <Button
                          size="sm"
                          variant={user.isActive ? "outline" : "default"}
                          disabled={isProcessing}
                          onClick={() => handleToggleStatus(user.id, user.isActive)}
                          className="h-8 text-xs"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : user.isActive ? (
                            <span className="text-destructive flex items-center gap-1">
                              <UserX className="w-3 h-3" />
                              Tangguhkan
                            </span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <UserCheck className="w-3 h-3" />
                              Aktifkan
                            </span>
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
