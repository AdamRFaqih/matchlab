"use server";

import { revalidatePath } from "next/cache";
import { updateOrganizationSettings } from "./service";

export async function updateOrganizationSettingsAction(params: {
  organizationId: string;
  name: string;
  cultureDescription: string;
}) {
  try {
    if (!params.name.trim()) {
      return { success: false, error: "Nama organisasi tidak boleh kosong." };
    }

    await updateOrganizationSettings({
      organizationId: params.organizationId,
      name: params.name.trim(),
      cultureDescription: params.cultureDescription.trim(),
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal memperbarui pengaturan organisasi.",
    };
  }
}
