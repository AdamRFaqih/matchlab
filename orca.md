# MatchLab (AI Multi-Tenant Talent Matchmaker & Marketplace)

## 1. Project Identity & Core Goal
MatchLab is a self-hosted AI-Powered Two-Way Talent Matchmaker & Early Screening SaaS and Talent Marketplace. It enables multiple organizations (university labs like ASE Lab, UKM, and tech startups) to screen candidates efficiently via AI, while providing reusable profiles for job seekers and a unified governance dashboard for Super Admins.

---

## 2. Platform Actors & RBAC
1. **Super Admin (`SUPER_ADMIN`)**: Platform governance, organization verification & suspension, plan tier quotas, user management, and LLM token cost telemetry in IDR.
2. **Org Admin (`COMPANY_USER` + `ORG_ADMIN`)**: Organization profile management, hiring quota monitoring, team seat allocation, and division oversight.
3. **Division Lead (`COMPANY_USER` + `DIVISION_LEAD`)**: Requisition creation via AI requirement translation (Flow A), candidate leaderboard assessment, and hiring decisions (Flow C).
4. **Job Seeker (`JOB_SEEKER`)**: Reusable applicant profile (`CandidateProfile`), multi-org applications (`JobApplication`), and 8-turn conversational screening (Flow B).

---

## 3. Tech Stack & Architecture
- **Framework:** Next.js 15 (App Router, React 19, TypeScript strict mode, `output: 'standalone'`).
- **UI:** Tailwind CSS + `shadcn/ui` + Lucide Icons.
- **Database & ORM:** PostgreSQL 16 + Prisma ORM (`prisma/schema.prisma`).
- **AI SDK:** Vercel AI SDK (`ai`, `@openrouter/ai-sdk-provider`, `@ai-sdk/google`, `@ai-sdk/openai`) with `zod` schemas.
- **Session & Auth:** Lightweight cookie-based session with multi-tenant role switching helper (`src/lib/auth/session.ts`).
- **Super Admin Hub:** `/super-admin` overview KPIs (including IDR token pricing), company management, and user moderation.

---

## 4. Infrastructure & Server Constraints
- **Dedicated Database:** Dedicated `matchlab-db` (`pgvector/pgvector:pg16`) via `docker-compose.yml`.
- **Assigned MatchLab Ports:**
  - Application Host Port: `3005` (maps to container port `3000`).
  - DB Host Port: `127.0.0.1:5435:5432`.
- **Ingress:** Cloudflare Tunnel pointing to `http://host.docker.internal:3005`.

---

## 5. Engineering & Cost Guardrails
- **Hard Turn Limit:** Server-enforced `MAX_INTERVIEW_TURNS = 8`.
- **Input Sanitization:** Character limit of `1200` characters wrapped in `<candidate_input>` XML tags.
- **LLM Cost Estimation:** Super admin tracks total tokens consumed (`totalTokensUsed` in sessions + `evalTokensUsed` in evaluations) and converts to Indonesian Rupiah (IDR).
- **Strict Typing:** Zero `any` policy; Prisma models and Zod schemas across all boundaries.

---

## 6. Verification Commands
1. `npx prisma validate`
2. `npm run typecheck`
3. `npm run build`
