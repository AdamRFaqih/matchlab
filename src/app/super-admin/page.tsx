import { getSuperAdminDashboardData } from "@/modules/super-admin/service";
import { OverviewKpiCards } from "@/modules/super-admin/components/OverviewKpiCards";
import { CompanyManagementTable } from "@/modules/super-admin/components/CompanyManagementTable";
import { UserManagementTable } from "@/modules/super-admin/components/UserManagementTable";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Super Admin Control Panel | MatchLab",
  description:
    "Pusat kendali multi-tenancy, kuota pelamar, verifikasi organisasi, dan metrik konsumsi LLM MatchLab.",
};

export default async function SuperAdminDashboardPage() {
  const data = await getSuperAdminDashboardData();

  return (
    <div className="space-y-8 pb-12">
      {/* Header section */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Super Admin Control Panel
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pantau kesehatan platform multi-tenant, biaya pemakaian token AI, serta moderasi organisasi dan pengguna.
        </p>
      </div>

      {/* KPI Overview Cards */}
      <section>
        <OverviewKpiCards kpis={data.kpis} />
      </section>

      {/* Company Management */}
      <section className="pt-2">
        <CompanyManagementTable initialCompanies={data.companies} />
      </section>

      {/* User Management */}
      <section className="pt-2">
        <UserManagementTable initialUsers={data.users} />
      </section>
    </div>
  );
}
