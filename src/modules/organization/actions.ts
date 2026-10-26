"use server";

import { revalidatePath } from "next/cache";
import { assertOrgAccess, toActionError } from "@/lib/auth/guards";
import { updateOrganizationSettings } from "./service";

export async function updateOrganizationSettingsAction(params: {
  organizationId: string;
  name: string;
  billingEmail?: string;
  cultureDescription?: string;
}) {
  try {
    const ctx = await assertOrgAccess(params.organizationId, { adminOnly: true });

    if (!params.name || !params.name.trim()) {
      return { success: false, error: "Nama organisasi tidak boleh kosong." };
    }

    await updateOrganizationSettings({
      organizationId: ctx.organizationId,
      actorId: ctx.user.id,
      actorEmail: ctx.user.email,
      name: params.name.trim(),
      billingEmail: params.billingEmail,
      cultureDescription: params.cultureDescription,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: toActionError(error, "Gagal memperbarui pengaturan organisasi."),
    };
  }
}
