import { getSession } from "@/lib/auth/session";
import { getOrganizationDashboardData } from "@/modules/organization/service";
import { OrganizationDashboardView } from "@/modules/organization/components/OrganizationDashboardView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard Tim & Organisasi | MatchLab",
  description: "Kelola lowongan aktif, pantau kuota pelamar, dan tinjau hasil wawancara AI kandidat.",
};

export default async function DashboardPage() {
  const sessionUser = await getSession();
  const activeOrgId =
    sessionUser?.activeOrgId || sessionUser?.memberships[0]?.organizationId;
  const orgRole = sessionUser?.activeOrgRole || sessionUser?.memberships[0]?.orgRole;

  const data = await getOrganizationDashboardData(activeOrgId, orgRole);

  return (
    <div className="space-y-6">
      <OrganizationDashboardView data={data} />
    </div>
  );
}
