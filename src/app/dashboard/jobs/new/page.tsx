import { JobRequisitionForm } from "@/modules/requisition/components/JobRequisitionForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buat Job Requisition Baru | MatchLab",
  description:
    "AI-Powered Requirement Translator untuk menyusun Scoring Rubric wawancara kandidat secara otomatis.",
};

export default function NewJobPage() {
  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Buat Job Requisition</h1>
        <p className="text-muted-foreground mt-1">
          Formula kebutuhan kandidat menjadi instrumen penyaringan AI otomatis berbasis studi kasus.
        </p>
      </div>

      <JobRequisitionForm />
    </div>
  );
}
