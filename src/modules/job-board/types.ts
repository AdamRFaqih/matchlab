export interface PublicJobItem {
  id: string;
  title: string;
  slug: string;
  roleSummary: string;
  requiredSkills: string[];
  maxTurns: number;
  createdAt: Date;
  organization: {
    id: string;
    name: string;
    slug: string;
    cultureDescription: string | null;
    isVerified: boolean;
  };
  applicantCount: number;
}

export interface PublicCompanyOption {
  id: string;
  name: string;
  slug: string;
}

export interface JobBoardData {
  jobs: PublicJobItem[];
  companies: PublicCompanyOption[];
}
