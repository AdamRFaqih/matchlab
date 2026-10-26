"use server";

import { revalidatePath } from "next/cache";
import type { OrgRole } from "@prisma/client";
import { assertOrgAccess, toActionError } from "@/lib/auth/guards";
import {
  inviteMember,
  revokeInvitation,
  changeMemberRole,
  removeMember,
} from "./service";

export async function inviteMemberAction(params: {
  email: string;
  orgRole: OrgRole;
}): Promise<{ success: boolean; inviteUrl?: string; emailSent?: boolean; error?: string }> {
  try {
    const ctx = await assertOrgAccess(undefined, { adminOnly: true });

    if (!params.email || !params.email.includes("@")) {
      return { success: false, error: "Alamat email tidak valid." };
    }

    const result = await inviteMember(
      { id: ctx.user.id, name: ctx.user.name, email: ctx.user.email },
      ctx.organizationId,
      params.email,
      params.orgRole
    );

    revalidatePath("/dashboard/team");
    return {
      success: true,
      inviteUrl: result.inviteUrl,
      emailSent: result.emailSent,
    };
  } catch (error) {
    return {
      success: false,
      error: toActionError(error, "Gagal mengundang anggota."),
    };
  }
}

export async function revokeInvitationAction(
  invitationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await assertOrgAccess(undefined, { adminOnly: true });
    await revokeInvitation(
      { id: ctx.user.id, name: ctx.user.name, email: ctx.user.email },
      ctx.organizationId,
      invitationId
    );
    revalidatePath("/dashboard/team");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: toActionError(error, "Gagal membatalkan undangan."),
    };
  }
}

export async function changeMemberRoleAction(
  memberId: string,
  newRole: OrgRole
): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await assertOrgAccess(undefined, { adminOnly: true });
    await changeMemberRole(
      { id: ctx.user.id, name: ctx.user.name, email: ctx.user.email },
      ctx.organizationId,
      memberId,
      newRole
    );
    revalidatePath("/dashboard/team");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: toActionError(error, "Gagal mengubah peran anggota."),
    };
  }
}

export async function removeMemberAction(
  memberId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await assertOrgAccess(undefined, { adminOnly: true });
    await removeMember(
      { id: ctx.user.id, name: ctx.user.name, email: ctx.user.email },
      ctx.organizationId,
      memberId
    );
    revalidatePath("/dashboard/team");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: toActionError(error, "Gagal menghapus anggota."),
    };
  }
}
