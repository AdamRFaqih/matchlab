import { JobRequisitionForm } from "@/modules/requisition/components/JobRequisitionForm";
import { getSession } from "@/lib/auth/session";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buat Job Requisition Baru | MatchLab",
  description:
    "AI-Powered Requirement Translator untuk menyusun Scoring Rubric wawancara kandidat secara otomatis.",
};

export default async function NewJobPage() {
  const sessionUser = await getSession();
  const activeOrgId = sessionUser?.activeOrgId || sessionUser?.memberships[0]?.organizationId;
  const activeOrgName = sessionUser?.memberships[0]?.organizationName;

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Buat Job Requisition</h1>
        <p className="text-muted-foreground mt-1">
          Formula kebutuhan kandidat menjadi instrumen penyaringan AI otomatis berbasis studi kasus dan Culture DNA tim.
        </p>
      </div>

      <JobRequisitionForm
        organizationId={activeOrgId}
        organizationName={activeOrgName}
      />
    </div>
  );
}
