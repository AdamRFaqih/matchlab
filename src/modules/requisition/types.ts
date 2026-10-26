import type { JobRequisition, Organization } from "@prisma/client";
import type {
  CreateJobRequisitionInput,
  JobSpec,
  ScoringRubric,
} from "@/lib/ai/schemas";

export type {
  CreateJobRequisitionInput,
  JobSpec,
  ScoringRubric,
};

export interface JobRequisitionWithOrg extends JobRequisition {
  organization: Organization;
}

export interface SaveJobResult {
  success: boolean;
  jobId?: string;
  slug?: string;
  shareableUrl?: string;
  error?: string;
}

export interface TranslateRequirementsResult {
  success: boolean;
  rubric?: ScoringRubric;
  error?: string;
}
