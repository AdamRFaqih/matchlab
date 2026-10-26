# Product Requirements Document (PRD): MatchLab Multi-Tenant SaaS & Talent Marketplace

## 1. Problem Statement & Evolution

MatchLab began as an early screening tool for small teams, university labs (e.g., ASE Lab), and student organizations (UKM) lacking dedicated technical recruiters.

In this transformation, MatchLab has become a **complete, production-grade Multi-Tenant SaaS and Talent Marketplace** supporting:
- **True Multi-Tenancy:** Isolated organizations with distinct subscription tiers, applicant allowances, and team management.
- **In-House Secure Authentication:** Scrypt per-user salted password hashing, DB-backed secure sessions with sliding 30-day expiry, email verification, and password reset.
- **Integrated Payments & Billing:** Midtrans Snap integration supporting Indonesian payment rails (QRIS, Virtual Accounts, Credit Cards) across three tiers: `FREE`, `PAY_PER_OPREC`, and `SME_PRO`.
- **Reusable Job Seeker Accounts:** Unified candidate identity across multiple applications with scorecard history and talent pool visibility.
- **Multi-Tier Role-Based Access Control (RBAC):** Super Admin, Org Admin, Division Lead, and Job Seeker with server-side assertion guards.
- **Platform Governance & Audit:** Super Admin control panel with cross-tenant revenue metrics, payment oversight (`/super-admin/billing`), and immutable audit trail (`/super-admin/audit`).
- **Regulatory Compliance:** Full compliance with Indonesia's Personal Data Protection Law (**UU PDP No. 27/2022**) via accessible `/terms` and `/privacy` documentation.

---

## 2. Platform Actors & RBAC

### 1. Super Admin (Platform Owner)
- **Role:** System-wide governance, infrastructure monitoring, and revenue oversight.
- **Key Capabilities:**
  - View cross-tenant KPI cards: Total Companies, Total Job Seekers, Total Active Jobs, and Total Revenue in IDR.
  - Organization verification, plan adjustments, quota editor, and instant suspension toggle.
  - Cross-tenant invoice inspection (`/super-admin/billing`) with status filtering.
  - Immutable platform audit log (`/super-admin/audit`) with action prefix filtering, actor search, and JSON metadata viewer.
  - User lifecycle management with session revocation on suspension.

### 2. Org Admin (Company / Lab Administrator)
- **Role:** Tenant owner managing company profile, team seats, and hiring budget.
- **Key Capabilities:**
  - Self-serve organization onboarding (`/onboarding`).
  - Configure company branding, billing email, and culture description (`/dashboard/settings`).
  - Team seat management & member invitations via email (`/dashboard/team`).
  - Billing dashboard (`/dashboard/billing`) with real-time quota gauges, plan upgrade via Midtrans Snap modal, and invoice history.
  - Requisition oversight and hiring status decisions (`/dashboard`).

### 3. Division Lead (Lab / Team Hiring Lead)
- **Role:** Technical or team lead creating requirements and evaluating applicants.
- **Key Capabilities:**
  - **Flow A:** Use the AI Requirement Translator (`/dashboard/jobs/new`) to convert casual descriptions into structured job specifications and scoring rubrics.
  - Publish requisitions to generate public apply links (`/apply/[slug]`).
  - **Flow C:** Review ranked candidate leaderboards (`/dashboard/jobs/[id]`), examine AI trait breakdowns, cite transcripts, and advance applicants (`SHORTLISTED`, `REJECTED`).

### 4. Job Seeker (Candidate / Talent Pool)
- **Role:** Applicant seeking positions across organizations with a reusable identity.
- **Key Capabilities:**
  - Persistent `CandidateProfile` (`cvSummaryText`, `portfolioUrl`, `skills`, `isOpenToPool`).
  - Account settings & password change (`/account`).
  - Apply to job requisitions across different organizations without re-entering basic qualifications.
  - **Flow B:** Participate in AI-guided conversational screening interviews (strictly capped at 8 turns) with atomic quota checking.
  - **Flow E:** Explore public opportunities on the Job Board (`/jobs`) and monitor application progress via Candidate Dashboard (`/candidate/dashboard`).

---

## 3. Subscription Tiers & Quota Management

| Tier | Code | Price (IDR) | Applicant Quota | Active Jobs | Team Seats | Billing Model |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Free** | `FREE` | Rp 0 | 20 pelamar | 1 lowongan | 2 anggota | Sekali pakai (starter) |
| **Pay-per-Oprec** | `PAY_PER_OPREC` | Rp 149.000 / paket | 150 pelamar / paket | 3 lowongan | 5 anggota | Top-up akumulatif per batch |
| **SME Pro** | `SME_PRO` | Rp 499.000 / bulan | 750 pelamar / bulan | Unlimited | Unlimited | Langganan 30 hari berulang |

### Quota Enforcement Rules:
1. **Atomic Consumption:** Applicant quota is decremented inside a database transaction (`consumeApplicantQuota`) when a candidate initiates their screening interview. If quota is exhausted, the applicant is politely notified and instructed to contact the recruiter.
2. **Job Limit Enforcement:** Free and Pay-per-Oprec plans enforce maximum active listings when creating or re-activating requisitions (`checkActiveJobLimit`).
3. **Team Seat Enforcement:** Invitations are rejected if the team has reached the maximum allowed members for their plan tier (`checkMemberLimit`).

---

## 4. Core User Flows

### Flow A: AI Requirement Translator (Division Lead / Org Admin)
1. Lead enters colloquial wishlists into `/dashboard/jobs/new`.
2. AI translates the prompt into structured `JobSpecification` & `ScoringRubric`:
   - Domain criteria and implicit behavioral traits with assigned weights.
   - Practical situational dilemmas that resist web searches.
3. System validates active job limit against the organization's plan tier.
4. Lead publishes the job requisition and shares `/apply/[slug]`.

### Flow B: Conversational Early Screening (Job Seeker)
1. Candidate navigates to `/apply/[slug]`. If unauthenticated, guided to login/signup.
2. System verifies candidate role and email verification status.
3. On interview start, `consumeApplicantQuota` atomically locks 1 applicant credit for the tenant.
4. AI interviewer initiates a scenario-based interview strictly capped at **8 turns**:
   - Turns 1–3: Technical depth.
   - Turns 4–7: Work habits, async communication, stress handling.
   - Turn 8: Interview conclusion.
5. The session locks and triggers Flow C evaluation.

### Flow C: Two-Way Matchmaking & Decision Hub (Org Admin / Division Lead)
1. AI Evaluator analyzes transcript against the job rubric.
2. Produces composite `matchScore` (0–100), domain score, implicit behavior score, flags, and executive summary.
3. Leads review the ranked leaderboard and advance top talent (`SHORTLISTED`, `REJECTED`).

### Flow D: Multi-Tenancy & Platform Oversight (Super Admin)
1. Super Admin accesses `/super-admin` control panel.
2. Monitors total companies, job seekers, active listings, and revenue metrics.
3. Inspects cross-tenant invoices at `/super-admin/billing`.
4. Audits platform security and operational events at `/super-admin/audit`.
5. Modifies quotas, overrides subscription tiers, and suspends organizations or users if needed.

### Flow E: Talent Marketplace & Candidate Portal (Job Seeker)
1. Job Seeker accesses `/jobs` to discover active requisitions across verified organizations.
2. Navigates to `/candidate/dashboard` to track progress across all applications and review AI evaluation feedback probes.
3. Updates qualifications, skills tags, and talent pool visibility via `/candidate/profile`.

---

## 5. Security & Technical Architecture

- **Session Management:** DB-backed `Session` table with 30-day sliding expiration, cryptographically random cookie token, stored SHA-256 hash.
- **Password Security:** Scrypt hashing with unique per-user salt + automatic upgrade for legacy static salt hashes.
- **Tenant Isolation:** Enforced via `src/lib/auth/guards.ts` assertions across all service operations.
- **Payment Gateway:** Midtrans Snap with SHA-512 signature verification and idempotent fulfillment.
- **Email Delivery:** Resend REST API integration with development console fallback.
- **Rate Limiting:** Sliding-window limiter on authentication, AI generation, and chat endpoints.
- **Legal Compliance:** Indonesian Personal Data Protection Law (**UU PDP No. 27/2022**) compliant terms and privacy policy.
