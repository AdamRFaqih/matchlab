import { getSession } from "@/lib/auth/session";
import { getOrganizationDashboardData } from "@/modules/organization/service";
import { OrganizationSettingsForm } from "@/modules/organization/components/OrganizationSettingsForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pengaturan Organisasi & Culture DNA | MatchLab",
  description: "Kelola profil organisasi dan suntikkan Company Culture DNA ke instrumen AI.",
};

export default async function OrganizationSettingsPage() {
  const sessionUser = await getSession();
  const activeOrgId =
    sessionUser?.activeOrgId || sessionUser?.memberships[0]?.organizationId;
  const orgRole = sessionUser?.activeOrgRole || sessionUser?.memberships[0]?.orgRole;

  const data = await getOrganizationDashboardData(activeOrgId, orgRole);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <OrganizationSettingsForm
        organization={data.organization}
        quota={data.quota}
        isOrgAdmin={data.isOrgAdmin}
      />
    </div>
  );
}
