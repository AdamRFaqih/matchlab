import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireOrgMember } from "@/lib/auth/guards";
import { getOrganizationDashboardData } from "@/modules/organization/service";
import { OrganizationDashboardView } from "@/modules/organization/components/OrganizationDashboardView";

export const metadata: Metadata = {
  title: "Dashboard Tim & Organisasi",
  description: "Kelola lowongan aktif, pantau kuota pelamar, dan tinjau hasil wawancara AI kandidat.",
};

export default async function DashboardPage() {
  const ctx = await requireOrgMember();

  const data = await getOrganizationDashboardData(ctx.organizationId, ctx.orgRole);

  if (!data) {
    redirect("/onboarding");
  }

  return (
    <div className="space-y-6">
      <OrganizationDashboardView data={data} />
    </div>
  );
}
