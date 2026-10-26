import type { Metadata } from "next";
import { requireOrgMember } from "@/lib/auth/guards";
import { listTeam } from "@/modules/team/service";
import { db } from "@/lib/db";
import { PLANS } from "@/lib/billing/plans";
import { TeamManagementView } from "@/modules/team/components/TeamManagementView";

export const metadata: Metadata = {
  title: "Manajemen Tim",
  description: "Kelola anggota tim dan hak akses organisasi.",
};

export default async function TeamPage() {
  const ctx = await requireOrgMember({ adminOnly: true });

  const org = await db.organization.findUniqueOrThrow({
    where: { id: ctx.organizationId },
    select: { name: true, planTier: true },
  });

  const { members, invitations } = await listTeam(ctx.organizationId);
  const maxMembers = PLANS[org.planTier].maxMembers;

  return (
    <TeamManagementView
      currentUserId={ctx.user.id}
      organizationName={org.name}
      members={members}
      invitations={invitations}
      maxMembers={maxMembers}
    />
  );
}
