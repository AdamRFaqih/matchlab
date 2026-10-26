import type { Metadata } from "next";
import { requireOrgMember } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { JobRequisitionForm } from "@/modules/requisition/components/JobRequisitionForm";

export const metadata: Metadata = {
  title: "Buat Lowongan Baru",
  description:
    "AI-Powered Requirement Translator untuk menyusun Scoring Rubric wawancara kandidat secara otomatis.",
};

export default async function NewJobPage() {
  const ctx = await requireOrgMember();

  const org = await db.organization.findUniqueOrThrow({
    where: { id: ctx.organizationId },
    select: { name: true },
  });

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Buat Lowongan Baru</h1>
        <p className="text-muted-foreground mt-1">
          Terjemahkan kriteria kandidat menjadi instrumen wawancara AI otomatis berbasis studi kasus dan Culture DNA organisasi.
        </p>
      </div>

      <JobRequisitionForm
        organizationId={ctx.organizationId}
        organizationName={org.name}
      />
    </div>
  );
}
