# MatchLab (AI Talent Matchmaker)

## 1. Project Identity & Core Goal
MatchLab is a self-hosted AI-Powered Two-Way Talent Matchmaker & Early Screening SaaS designed for university labs (e.g., ASE Lab), student organizations (UKM), and SMEs without dedicated HR departments.

## 2. Infrastructure & `aselab` Server Constraints (CRITICAL)
- **Dedicated Database:** Always use the dedicated `matchlab-db` (`pgvector/pgvector:pg16`) container defined in `docker-compose.yml`. Do NOT share databases with existing host containers.
- **Forbidden Host Ports:** The `aselab` server already uses ports `80, 443, 3000, 3001, 3002, 5432, 5563, 5678, 8000, 8080, 8081, 8082, 8765, 9000, 9001, 9002, 9091, 9100`.
- **Assigned MatchLab Ports:**
  - Application Host Port: `3005` (mapped to container port `3000`).
  - Dedicated DB Host Port (for dev/migrations): `127.0.0.1:5435:5432` (internal Docker network uses `db:5432`).
- **Ingress:** Exposed via the existing `cloudflare_tunnel` container on `aselab` pointing to `http://host.docker.internal:3005` (or `http://172.17.0.1:3005`).

## 3. Tech Stack & Architecture
- **Framework:** Next.js 15 (App Router, TypeScript strict mode, `output: 'standalone'`).
- **UI:** Tailwind CSS + `shadcn/ui` + Lucide Icons.
- **Database & ORM:** PostgreSQL 16 + Prisma ORM (`prisma/schema.prisma`).
- **AI SDK:** Vercel AI SDK (`ai`, `@openrouter/ai-sdk-provider`, `@ai-sdk/google`, or `@ai-sdk/openai`) with `zod` structured outputs.
- **Directory Structure:**
  - `src/app/` -> App Router pages, layouts, and thin API/Server Action handlers.
  - `src/modules/requisition/` -> Flow A: AI Requirement Translator service, repository, and UI components.
  - `src/modules/screening/` -> Flow B: Candidate 8-turn conversational screening engine & chat UI.
  - `src/modules/evaluation/` -> Flow C: Two-way matchmaking judge & HR leaderboard.
  - `src/lib/ai/` -> Prompts, model initialization, and Zod schemas (`schemas.ts`).
  - `src/lib/db.ts` -> Prisma client singleton.

## 4. Engineering & Cost Guardrails
- **Hard Turn Limit:** Enforce `MAX_INTERVIEW_TURNS = 8` on the server before calling the LLM API.
- **Input Sanitization:** Limit candidate message length to `1200` characters and wrap candidate text in `<candidate_input>` XML tags to prevent prompt injection/jailbreaking.
- **Zero `any` Policy:** All data crossing module boundaries must be typed via Prisma types or Zod schemas.

## 5. Verification Commands for Orca
After completing each task slice, verify your work by running:
1. `npx prisma validate`
2. `npm run typecheck` (or `npx tsc --noEmit`)
3. `npm run build`
