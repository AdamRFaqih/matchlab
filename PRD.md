# Product Requirements Document (PRD): MatchLab Multi-Tenant SaaS & Talent Marketplace

## 1. Problem Statement & Evolution
MatchLab began as an early screening tool for small teams, university labs (e.g., ASE Lab), and student organizations (UKM) lacking dedicated technical recruiters.
In this upgraded evolution, MatchLab expands into a **full Multi-Tenant SaaS and Talent Marketplace** supporting:
- Multiple isolated organizations/companies under distinct subscription tiers and quotas.
- Reusable Job Seeker accounts with unified candidate profiles across multiple openings.
- Multi-tier Role-Based Access Control (RBAC).
- Super Admin system oversight for platform-wide metrics, tenant management, and token cost tracking.

---

## 2. The 4 Platform Actors

### 1. Super Admin (Platform Owner)
- **Role:** System-wide governance and infrastructure monitoring.
- **Key Capabilities:**
  - View cross-tenant KPI cards: Total Companies, Total Job Seekers, Total Active Jobs, and Total LLM Tokens Consumed with estimated Rupiah cost.
  - Organization verification and suspension toggles.
  - PlanTier adjustments (`PAY_PER_OPREC` vs. `SME_PRO`) and applicant quota allocation.
  - User and Job Seeker lifecycle management (view all users, filter by system role, toggle active/suspended status).

### 2. Org Admin (Company / Lab Administrator)
- **Role:** Tenant owner managing company profile, team seats, and hiring budget.
- **Key Capabilities:**
  - Configure organization details (`cultureDescription`, company branding, slug).
  - Invite and manage Division Leads (`OrganizationMember` with `orgRole = DIVISION_LEAD`).
  - Monitor organization-level applicant quota consumption and subscription tier.

### 3. Division Lead (Lab / Team Hiring Lead)
- **Role:** Technical or team lead creating requirements and evaluating applicants.
- **Key Capabilities:**
  - **Flow A:** Use the AI Requirement Translator to convert casual descriptions into structured job specifications and scoring rubrics.
  - Publish requisitions to generate public apply links (`/apply/[slug]`).
  - **Flow C:** Review ranked candidate leaderboards, examine AI trait breakdowns, and update application statuses (`SHORTLISTED`, `REJECTED`).

### 4. Job Seeker (Candidate / Talent Pool)
- **Role:** Applicant seeking positions across organizations with a reusable identity.
- **Key Capabilities:**
  - Owns a persistent `CandidateProfile` (`cvSummaryText`, `portfolioUrl`, `skills`, `isOpenToPool`).
  - Applies to job requisitions across different organizations without re-entering basic qualifications.
  - **Flow B:** Participates in AI-guided conversational screening interviews (capped at 8 turns).
  - Tracks screening progress and receives feedback probes.

---

## 3. Core User Flows

### Flow A: AI Requirement Translator (Division Lead / Org Admin)
1. Lead inputs a casual requirement (e.g., *"Butuh asisten lab yang ngerti dasar Docker & Linux, inisiatif tinggi, gak gampang hilang pas minggu ujian"*).
2. AI translates the prompt into structured `JobSpecification` & `ScoringRubric`:
   - Domain criteria and implicit behavioral traits.
   - Situational probe questions.
3. Lead publishes the job requisition and shares `/apply/[slug]`.

### Flow B: Conversational Early Screening (Job Seeker)
1. Candidate navigates to `/apply/[slug]`. If already logged in, their `CandidateProfile` auto-populates; otherwise, a reusable seeker account is created.
2. AI interviewer initiates a scenario-based interview strictly capped at **8 turns**.
3. Once completed (`turnCount >= 8`), the interview locks and triggers Flow C evaluation.

### Flow C: Two-Way Matchmaking & Decision Hub (Org Admin / Division Lead)
1. AI Evaluator analyzes transcript against the job rubric.
2. Produces composite `matchScore` (0–100), domain score, implicit behavior score, flags, and executive summary.
3. Leads review the ranked leaderboard and advance top talent.

### Flow D: Multi-Tenancy & Platform Oversight (Super Admin)
1. Super Admin accesses `/super-admin` control panel.
2. Monitors total companies, job seekers, active listings, and LLM token expenditures in Rupiah (IDR).
3. Verifies new organizations, modifies quotas, and moderates user accounts.

---

## 4. Multi-Tenant Data Architecture
- `User`: Global authentication identity with `systemRole` (`SUPER_ADMIN`, `COMPANY_USER`, `JOB_SEEKER`).
- `Organization`: Tenant entity with `planTier`, `applicantQuota`, `cultureDescription`, and `isVerified`.
- `OrganizationMember`: M-to-N join table assigning `User` to `Organization` with `orgRole` (`ORG_ADMIN`, `DIVISION_LEAD`).
- `CandidateProfile`: 1-to-1 extension of `User` for `JOB_SEEKER`.
- `JobApplication`: Connection between `CandidateProfile` and `JobRequisition`, owning the `InterviewSession` and `Evaluation`.
