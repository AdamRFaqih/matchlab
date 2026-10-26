import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireOrgMember } from "@/lib/auth/guards";
import { getOrganizationDashboardData } from "@/modules/organization/service";
import { OrganizationSettingsForm } from "@/modules/organization/components/OrganizationSettingsForm";

export const metadata: Metadata = {
  title: "Pengaturan Organisasi",
  description: "Kelola profil organisasi, billing email, dan Culture DNA untuk instrumen evaluasi AI.",
};

export default async function OrganizationSettingsPage() {
  const ctx = await requireOrgMember({ adminOnly: true });

  const data = await getOrganizationDashboardData(ctx.organizationId, ctx.orgRole);

  if (!data) {
    notFound();
  }

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
