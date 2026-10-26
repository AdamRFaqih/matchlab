import type { Metadata } from "next";
import Link from "next/link";
import { ScrollText, ArrowLeft, Search } from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = {
  title: "Audit Log Platform",
  description: "Catatan aktivitas administratif dan keamanan sistem MatchLab.",
};

export default async function SuperAdminAuditPage(props: {
  searchParams: Promise<{ q?: string; prefix?: string; page?: string }>;
}) {
  await requireSuperAdmin();
  const searchParams = await props.searchParams;

  const page = Math.max(1, parseInt(searchParams.page || "1", 10));
  const pageSize = 50;
  const skip = (page - 1) * pageSize;

  const prefix = searchParams.prefix;
  const q = searchParams.q?.trim().toLowerCase();

  const where: Record<string, unknown> = {};

  if (prefix && prefix !== "ALL") {
    where.action = { startsWith: prefix };
  }

  if (q) {
    where.OR = [
      { actorEmail: { contains: q, mode: "insensitive" } },
      { action: { contains: q, mode: "insensitive" } },
      { targetType: { contains: q, mode: "insensitive" } },
    ];
  }

  const [logs, totalCount] = await Promise.all([
    db.auditLog.findMany({
      where,
      include: {
        organization: {
          select: { name: true, slug: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    db.auditLog.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const prefixes = [
    { label: "Semua", value: "ALL" },
    { label: "User", value: "user." },
    { label: "Organisasi", value: "org." },
    { label: "Member", value: "member." },
    { label: "Lowongan", value: "job." },
    { label: "Billing", value: "billing." },
    { label: "Lamaran", value: "application." },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <Link
            href="/super-admin"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Ringkasan
          </Link>
          <h1 className="text-2xl font-bold tracking-tight mt-1 flex items-center gap-2">
            <ScrollText className="w-6 h-6 text-purple-600" />
            Audit Log Platform
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Total {totalCount} log aktivitas terekam di sistem.
          </p>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-1 bg-muted/60 p-1 rounded-lg text-xs">
          {prefixes.map((p) => {
            const isSelected = (!prefix && p.value === "ALL") || prefix === p.value;
            return (
              <Link
                key={p.value}
                href={`/super-admin/audit?prefix=${p.value}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  isSelected ? "bg-background shadow-xs font-semibold text-foreground" : "text-muted-foreground"
                }`}
              >
                {p.label}
              </Link>
            );
          })}
        </div>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div>
            <CardTitle className="text-base">Catatan Aktivitas</CardTitle>
            <CardDescription className="text-xs">
              Halaman {page} dari {totalPages}
            </CardDescription>
          </div>

          <form method="GET" action="/super-admin/audit" className="relative w-full sm:w-64">
            {prefix && <input type="hidden" name="prefix" value={prefix} />}
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={q || ""}
              placeholder="Cari aksi atau email..."
              className="pl-8 text-xs h-9"
            />
          </form>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b bg-muted/30 font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Aksi (Action)</th>
                  <th className="py-3 px-4">Aktor / Email</th>
                  <th className="py-3 px-4">Organisasi</th>
                  <th className="py-3 px-4">Target & Metadata</th>
                  <th className="py-3 px-4 text-right">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      Tidak ada audit log yang sesuai.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 align-top whitespace-nowrap text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString("id-ID")}
                      </td>

                      <td className="py-3 px-4 align-top">
                        <Badge variant="outline" className="font-mono text-[10px] py-0">
                          {log.action}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 align-top">
                        <div className="font-medium text-foreground">{log.actorEmail || "Sistem"}</div>
                      </td>

                      <td className="py-3 px-4 align-top">
                        {log.organization ? (
                          <span className="font-medium text-foreground">{log.organization.name}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 align-top max-w-xs">
                        {log.targetType && (
                          <div className="text-[11px] text-muted-foreground mb-0.5">
                            Target: <span className="font-semibold text-foreground">{log.targetType}</span>
                            {log.targetId && ` (${log.targetId.slice(0, 10)}...)`}
                          </div>
                        )}
                        {log.metadata && (
                          <details className="cursor-pointer text-[10px] text-muted-foreground">
                            <summary className="hover:underline text-primary">Lihat detail JSON</summary>
                            <pre className="p-2 mt-1 rounded bg-muted/60 font-mono overflow-x-auto text-[10px]">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </td>

                      <td className="py-3 px-4 align-top text-right text-muted-foreground font-mono">
                        {log.ipAddress || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="p-4 border-t flex items-center justify-between text-xs text-muted-foreground">
              <div>
                Halaman {page} dari {totalPages}
              </div>
              <div className="flex items-center gap-2">
                {page > 1 && (
                  <Link
                    href={`/super-admin/audit?page=${page - 1}${prefix ? `&prefix=${prefix}` : ""}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                    className="px-3 py-1 rounded border hover:bg-muted font-medium text-foreground"
                  >
                    Sebelumnya
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={`/super-admin/audit?page=${page + 1}${prefix ? `&prefix=${prefix}` : ""}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                    className="px-3 py-1 rounded border hover:bg-muted font-medium text-foreground"
                  >
                    Selanjutnya
                  </Link>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
