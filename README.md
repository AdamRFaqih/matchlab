# MatchLab 🔬🤖

> **AI-Powered Multi-Tenant SaaS, Talent Marketplace & Conversational Early Screening Platform**  
> Built for university research laboratories (e.g., ASE Lab), student organizations (UKM), and fast-growing tech startups without dedicated technical recruiting teams.

---

## 📌 Problem & Overview

Small organizations, academic labs, and early-stage startups face recurrent hiring bottlenecks:
- **Busy Leads:** Division heads and lab leads lack the time to conduct dozens of 1-on-1 preliminary interviews.
- **Context Gap:** Non-technical HR or administrative staff cannot probe deep, cross-domain technical concepts.
- **Form & CV Limitations:** Static Google Forms and CVs capture only superficial, easily embellished credentials (GPA, buzzwords) while missing critical work habits, async communication, ownership, and composure under pressure.

**MatchLab** solves this by delivering an end-to-end multi-tenant platform with a three-stage conversational AI pipeline:
1. **Translates informal recruiter wishlists** into structured rubrics and scenario dilemmas.
2. **Conducts dynamic, scenario-based interviews** directly with candidates via an 8-turn interactive chat agent.
3. **Evaluates transcripts objectively** with evidence-backed green/red flags, domain & implicit behavior scoring, and ranked leaderboards.
4. **Unifies candidate profiles** across multiple organizations in an open talent marketplace with dedicated role-based portals.

---

## 👥 Platform Actors & RBAC

MatchLab implements strict multi-tier Role-Based Access Control (RBAC):

| Role | System Role | Org Role | Key Capabilities & Accessible Routes |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `SUPER_ADMIN` | — | Platform governance, tenant verification/suspension, plan tier adjustments, applicant quotas, user moderation, and LLM token cost telemetry in IDR (`/super-admin`). |
| **Org Admin** | `COMPANY_USER` | `ORG_ADMIN` | Tenant administration, company culture description, applicant quota monitoring, team seat management, and requisition oversight (`/dashboard`, `/dashboard/settings`). |
| **Division Lead** | `COMPANY_USER` | `DIVISION_LEAD` | Technical job requisition creation via AI requirement translation (Flow A), candidate leaderboard review, transcript inspection, and hiring status updates (`/dashboard/jobs/new`, `/dashboard/jobs/[id]`). |
| **Job Seeker** | `JOB_SEEKER` | — | Reusable candidate profile, public job discovery, application status tracking, scorecard feedback review, and 8-turn conversational screening (`/candidate/dashboard`, `/candidate/profile`, `/jobs`, `/apply/[slug]`). |

---

## 🚀 Core User Flows

```
┌─────────────────────────────────┐
│ Flow A: Requirement Translator  │  Lead enters colloquial wishlists -> AI generates
│ (/dashboard/jobs/new)           │  JobSpec & weighted ScoringRubric -> Publishes requisition
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ Flow B: Conversational Screening│  Candidate visits /apply/[slug] -> Engages in 8-turn
│ (/apply/[slug])                 │  scenario-based chat -> Locked & submitted for evaluation
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ Flow C: Decision Hub            │  Evaluator AI produces MatchScore, Domain & Implicit
│ (/dashboard/jobs/[id])          │  breakdowns, Green/Red flags, and human follow-up probes
└────────────────┬────────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
┌─────────────────┐ ┌─────────────────┐
│ Flow D: Gov Hub │ │ Flow E: Seeker  │
│ (/super-admin)  │ │ (/candidate/*)  │
│ Cross-org KPIs  │ │ Reusable profile│
│ & IDR telemetry │ │ & multi-app hub │
└─────────────────┘ └─────────────────┘
```

### 1. Flow A: AI Requirement Translator (Division Lead / Org Admin)
- **Input:** Recruiter enters colloquial requirements (e.g., *"Need a lab assistant with solid Linux/Docker basics, high initiative, who doesn't vanish during midterm exams"*).
- **Processing:** AI translates unstructured text into:
  - Role overview and target profile.
  - Weighted criteria (Technical Domain vs. Implicit Behavioral Habits).
  - Practical, scenario-based dilemmas that cannot be easily Googled.
- **Output:** Configurable requisition with a shareable public URL (`/apply/[slug]`).

### 2. Flow B: Conversational Early Screening (Candidate Experience)
- **Application:** Candidate profile auto-populates from their reusable `CandidateProfile` or registers instantly.
- **Interactive Interview:** AI conducts a dynamic, scenario-based chat session strictly capped at **8 turns**:
  - **Turns 1–3:** Technical depth and practical domain problem-solving.
  - **Turns 4–7:** Work habits, async communication, ownership, and response to crunch/stress.
  - **Turn 8:** Graceful interview conclusion and handoff.
- **Automatic Lock:** Upon reaching the turn limit, the session locks and initiates the evaluation pipeline.

### 3. Flow C: Decision Hub & Leaderboard (Division Lead / Org Admin)
- **Scoring Engine:** AI evaluates full interview transcripts against the job's defined rubric.
- **Comprehensive Scorecard:**
  - Overall `MatchScore` (0–100 weighted composite).
  - `DomainScore` & `ImplicitBehaviorScore` sub-breakdowns.
  - Evidence quotes cited directly from candidate statements.
  - Identified **Green Flags** (standout capabilities) and **Red Flags** (inconsistencies, superficial answers).
  - Executive summary and tailored probe questions for the final human interview round.
- **Leaderboard:** Filterable applicant management table (`ALL`, `SHORTLISTED`, `EVALUATED`, `IN_PROGRESS`, `REGISTERED`, `REJECTED`).

### 4. Flow D: Platform Governance & Cost Telemetry (Super Admin)
- Cross-tenant KPI cards: Total Companies, Total Job Seekers, Total Active Jobs, and Total LLM Tokens Consumed with estimated Rupiah (IDR) costs.
- Organization verification and quota management (`PAY_PER_OPREC` vs. `SME_PRO`).
- Global user moderation and status toggling.

### 5. Flow E: Talent Marketplace & Candidate Portal (Job Seeker)
- **Public Job Board (`/jobs`):** Explore open requisitions across verified organizations with skill tags and instant application links.
- **Candidate Dashboard (`/candidate/dashboard`):** Track application statuses across multiple organizations, review AI evaluations, and prepare with suggested follow-up probes.
- **Candidate Profile (`/candidate/profile`):** Maintain a reusable CV summary, portfolio link, skills tags, and public talent pool availability toggle.

---

## 🔑 Seeded Demo Accounts (One-Click Role Switcher)

The application includes a built-in **Role Switcher** in the top navigation bar for testing and evaluation. You can also log in directly using the seeded credentials:

| Role | Name | Email | Password | Organization / Context | Default Portal |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | MatchLab Super Admin | `admin@matchlab.id` | `admin123` | Platform-wide | `/super-admin` |
| **Org Admin** | Dr. Hendra Wibowo | `hendra@aselab.id` | `aselab123` | ASE Research Lab | `/dashboard` |
| **Division Lead** | Budi Santoso | `budi@aselab.id` | `aselab123` | ASE Research Lab | `/dashboard/jobs/new` |
| **Org Admin** | Siti Rahma | `siti@nusantaratech.id` | `nusantara123` | Nusantara Tech Startup | `/dashboard` |
| **Job Seeker** | Dewi Lestari | `dewi@example.com` | `dewi123` | Senior Fullstack Engineer | `/candidate/dashboard` |
| **Job Seeker** | Fajar Pratama | `fajar@example.com` | `fajar123` | Junior AI / Backend Candidate | `/candidate/dashboard` |
| **Job Seeker** | Bagas Pratama | `bagas@example.com` | `bagas123` | Staff SRE Specialist (Shortlisted) | `/candidate/dashboard` |
| **Job Seeker** | Aisyah Putri | `aisyah@example.com` | `aisyah123` | Frontend & UX Specialist | `/candidate/dashboard` |

---

## 🛠️ Tech Stack & Architecture

- **Web Framework:** [Next.js 15](https://nextjs.org/) (App Router, React 19, TypeScript strict mode, standalone output).
- **Styling & UI:** [Tailwind CSS v4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/) components, and [Lucide Icons](https://lucide.dev/).
- **Database & ORM:** [PostgreSQL 16](https://www.postgresql.org/) (with `pgvector/pgvector:pg16`), [Prisma ORM](https://www.prisma.io/).
- **AI Engine:** [Vercel AI SDK](https://sdk.vercel.ai/) (`ai`) with Zod-enforced structured outputs.
  - Multi-provider flexibility: **OpenRouter**, **Google Gemini**, or **OpenAI**.
- **Containerization:** Multi-stage Docker build (Node 22 Alpine) and Docker Compose.

---

## 📂 Repository Structure

```text
├── Dockerfile                  # Multi-stage production container build (Node 22 Alpine)
├── docker-compose.yml          # Dedicated services (matchlab-app on :3005, matchlab-db on :5435)
├── docker-entrypoint.sh        # Container startup migration runner
├── prisma/
│   ├── schema.prisma           # Multi-tenant schema (User, Organization, Requisition, Candidate, etc.)
│   ├── migrations/             # Database migration history
│   └── seed.ts                 # Comprehensive multi-tenant seed script
├── public/                     # Static assets and icons
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/health/         # Container health check endpoint
│   │   ├── apply/[slug]/       # Flow B: Candidate interview page
│   │   ├── candidate/          # Flow E: Job Seeker Portal
│   │   │   ├── dashboard/      # Applications list & scorecard summaries
│   │   │   └── profile/        # Reusable candidate profile & skills editor
│   │   ├── dashboard/          # Flow A & C: Organization Dashboard
│   │   │   ├── jobs/
│   │   │   │   ├── new/        # AI Job Requisition Creator
│   │   │   │   └── [id]/       # Job detail, live transcript review & leaderboard
│   │   │   └── settings/       # Organization branding, quotas & culture profile
│   │   ├── jobs/               # Public multi-organization job board
│   │   ├── super-admin/        # Flow D: Platform governance & IDR cost telemetry
│   │   ├── globals.css         # Theme tokens and Tailwind CSS styling
│   │   ├── layout.tsx          # Root layout with RoleSwitcher navigation
│   │   └── page.tsx            # Landing page
│   ├── components/             # Reusable UI primitives (Button, Card, Badge, Dialog, etc.)
│   │   ├── auth/
│   │   │   └── RoleSwitcher.tsx# Interactive simulation role switcher
│   │   └── ui/                 # shadcn/ui components
│   ├── lib/
│   │   ├── db.ts               # Prisma client singleton
│   │   ├── utils.ts            # Formatting & class merging utilities
│   │   ├── auth/               # Multi-tenant authentication & session management
│   │   │   ├── actions.ts      # Session switching server actions
│   │   │   ├── password.ts     # Scrypt hashing and verification
│   │   │   ├── session.ts      # Cookie session resolution & mock fallbacks
│   │   │   └── types.ts        # Auth & DEMO_ROLES type definitions
│   │   └── ai/                 # Vercel AI SDK integration
│   │       ├── models.ts       # Multi-provider model resolver (OpenRouter, Gemini, OpenAI)
│   │       ├── schemas.ts      # Zod validation schemas for rubrics and evaluations
│   │       ├── translator.ts   # Flow A translation prompt & generation
│   │       ├── interviewer.ts  # Flow B conversational interview agent
│   │       └── evaluator.ts    # Flow C rubric-based transcript evaluation
│   └── modules/                # Feature-sliced domain modules
│       ├── candidate/          # Candidate profile & application tracking
│       ├── evaluation/         # Candidate scoring, leaderboard, and review views
│       ├── job-board/          # Public job directory & search
│       ├── organization/       # Tenant management & settings
│       ├── requisition/        # Job requisition logic, forms, and actions
│       ├── screening/          # Interview chat session, message handling, and state
│       └── super-admin/        # Platform analytics, company moderation & user tables
```

---

## ⚙️ Prerequisites & Setup

### Requirements
- **Docker & Docker Compose** (Recommended for containerized deployment)
- *Or for local host development:*
  - Node.js `20.x` or `22.x+`
  - npm `10.x+`
  - PostgreSQL 16 instance with `pgvector`

---

## 🔑 Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### Essential Configuration

```env
# Database Credentials
POSTGRES_USER=matchlab
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=matchlab_prod

# Host Database Connection (Port 5435 avoids collisions with default Postgres port 5432)
DATABASE_URL="postgresql://matchlab:your_secure_password_here@127.0.0.1:5435/matchlab_prod?schema=public"

# Public Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3005"
```

### LLM Provider Setup

MatchLab supports three provider options:

#### Option A: OpenRouter (Recommended)
```env
AI_PROVIDER="openrouter"
OPENROUTER_API_KEY="sk-or-v1-..."
AI_MODEL_TRANSLATOR="google/gemini-2.5-flash"
AI_MODEL_INTERVIEWER="google/gemini-2.5-flash"
AI_MODEL_EVALUATOR="google/gemini-2.5-pro"
```

#### Option B: Google Gemini (Direct)
```env
AI_PROVIDER="google"
GEMINI_API_KEY="AIzaSy..."
AI_MODEL_TRANSLATOR="gemini-2.5-flash"
AI_MODEL_INTERVIEWER="gemini-2.5-flash"
AI_MODEL_EVALUATOR="gemini-2.5-pro"
```

#### Option C: OpenAI (Direct)
```env
AI_PROVIDER="openai"
OPENAI_API_KEY="sk-..."
AI_MODEL_TRANSLATOR="gpt-4o-mini"
AI_MODEL_INTERVIEWER="gpt-4o-mini"
AI_MODEL_EVALUATOR="gpt-4o"
```

---

## 🐳 Running with Docker (Recommended)

1. **Start the Database and Application:**
   ```bash
   docker compose up -d --build
   ```

2. **Check Container Status and Logs:**
   ```bash
   docker compose ps
   docker compose logs -f app
   ```

3. **Access Services:**
   - **Web App:** [http://localhost:3005](http://localhost:3005)
   - **Health Check:** [http://localhost:3005/api/health](http://localhost:3005/api/health)
   - **Database (Host Access):** `localhost:5435`

4. **Run Database Seed (Inside Container or via Host):**
   ```bash
   # Via container
   docker compose exec app npx tsx prisma/seed.ts

   # Or via host (pointing to port 5435 in .env)
   npm run seed
   ```

5. **Stop Services:**
   ```bash
   docker compose down
   ```

---

## 💻 Local Development Setup

If running directly on your host machine:

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Start the Database Container:**
   ```bash
   docker compose up -d db
   ```

3. **Generate Prisma Client and Run Migrations:**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

4. **Seed the Database with Demo Organizations & Candidates:**
   ```bash
   npm run seed
   ```

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛡️ Guardrails, Cost Telemetry & Safety Controls

- **Hard Turn Limit:** Server enforces `MAX_INTERVIEW_TURNS = 8` (configurable between 4–12 in job requisition) before any LLM API call is triggered.
- **Input Sanitization:** Candidate responses are restricted to a maximum of 1,200 characters and encapsulated inside `<candidate_input>` XML tags to resist prompt injection or jailbreak attempts.
- **LLM Cost Telemetry (IDR):** Real-time token consumption tracking (`totalTokensUsed` in interview sessions + `evalTokensUsed` in evaluations) with conversion to Indonesian Rupiah (Rp 0,04 per token / ~$2.50 per 1M tokens) displayed in the Super Admin dashboard.
- **Strict Tenant Isolation:** Every organization query scopes data strictly by `organizationId`. Cross-tenant data leakage is prevented at both the service layer and database schema level.
- **Non-Colliding Host Ports:** Mapped to application port `3005` and database port `5435` to avoid collisions on shared servers.

---

## 🧪 Verification & Maintenance Commands

```bash
# Validate Prisma schema
npx prisma validate

# Run TypeScript compilation check (Strict Zero 'any')
npm run typecheck

# Run ESLint check
npm run lint

# Run database seed
npm run seed

# Production Next.js build check
npm run build
```

---

## 📄 License

This project is licensed under the MIT License.
