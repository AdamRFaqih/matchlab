import type { ApplicationStatus } from "@prisma/client";

export interface CandidateProfileData {
  id?: string;
  userId: string;
  name: string;
  email: string;
  cvSummaryText: string;
  skills: string[];
  portfolioUrl: string | null;
  isOpenToPool: boolean;
}

export interface CandidateApplicationItem {
  id: string;
  jobId: string;
  jobTitle: string;
  jobSlug: string;
  maxTurns: number;
  organizationName: string;
  organizationSlug: string;
  organizationVerified: boolean;
  status: ApplicationStatus;
  appliedAt: Date;
  turnCount: number;
  isCompleted: boolean;
  evaluation: {
    matchScore: number;
    domainScore: number;
    implicitBehaviorScore: number;
    executiveSummary: string;
    greenFlags: string[];
    finalInterviewProbes: string[];
  } | null;
}

export interface CandidateDashboardData {
  profile: CandidateProfileData | null;
  applications: CandidateApplicationItem[];
  stats: {
    totalApplications: number;
    inProgress: number;
    evaluated: number;
    shortlisted: number;
  };
}
