# MatchLab 🔬🤖

> **AI-Powered Two-Way Talent Matchmaker & Conversational Early Screening Platform**  
> Designed for university laboratories (e.g., ASE Lab), student organizations (UKM), and early-stage SMEs without dedicated technical recruiters.

---

## 📌 Problem & Overview

Small organizations and research labs face recurrent recruitment challenges:
- **Busy Leads:** Division heads and lab leads lack the time to conduct dozens of 1-on-1 preliminary interviews.
- **Context Gap:** Non-technical HR or administrative staff often cannot probe cross-domain technical concepts.
- **Form Limitations:** Static Google Forms and CVs capture only superficial, easily faked credentials (GPA, buzzwords) while missing critical work habits, async communication, ownership, and problem-solving under stress.

**MatchLab** solves this by automating early-stage recruitment through a three-stage conversational AI pipeline:
1. Translates informal recruiter wishlists into structured rubrics.
2. Conducts realistic, scenario-based interviews directly with candidates.
3. Scores transcripts objectively with evidence-backed green/red flags and leaderboards.

---

## 🚀 Core User Flows

```
┌─────────────────────────────────┐
│ Flow A: Requirement Translator  │  Lead enters casual notes -> AI produces structured
│ (/dashboard/jobs/new)           │  JobSpec & weighted ScoringRubric -> Lead publishes job
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ Flow B: Conversational Screening│  Candidate visits /apply/[slug] -> Engages in 8-turn
│ (/apply/[slug])                 │  scenario-based chat -> Locked & sent to evaluator
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ Flow C: Decision Hub            │  Evaluator AI produces MatchScore, Domain & Implicit
│ (/dashboard/jobs/[id])          │  breakdowns, Green/Red flags, and human follow-up probes
└─────────────────────────────────┘
```

### 1. Flow A: AI Requirement Translator (Division Lead / Recruiter)
- **Input:** Recruiter enters colloquial requirements (e.g., *"Need a lab assistant with solid Linux/Docker basics, high initiative, who doesn't vanish during midterm exams"*).
- **Processing:** AI translates unstructured text into:
  - Role overview and target profile.
  - Weighted criteria (Explicit Technical Domain vs. Implicit Behavioral Habits).
  - Practical, scenario-based dilemmas that can't be easily Googled.
- **Output:** Configurable requisition with a shareable public URL (`/apply/[slug]`).

### 2. Flow B: Conversational Early Screening (Candidate Experience)
- **Application:** Candidate enters basic info (Name, Email, CV summary, Portfolio link).
- **Interactive Interview:** AI conducts a dynamic, scenario-based chat session strictly capped at **8 turns**:
  - **Turns 1–3:** Technical depth and practical domain problem-solving.
  - **Turns 4–7:** Work habits, async communication, ownership, and response to crunch/stress.
  - **Turn 8:** Graceful interview conclusion and handoff.
- **Automatic Lock:** Upon reaching the turn limit, the session locks and initiates the evaluation pipeline.

### 3. Flow C: Decision Hub & Leaderboard (HR / Hiring Manager)
- **Scoring Engine:** AI evaluates full interview transcripts against the job's defined rubric.
- **Comprehensive Scorecard:**
  - Overall `MatchScore` (0–100, weighted composite).
  - `DomainScore` & `ImplicitBehaviorScore` sub-breakdowns.
  - Evidence quotes cited directly from candidate statements.
  - Identified **Green Flags** (standout capabilities) and **Red Flags** (inconsistencies, superficial answers).
  - Executive summary and tailored probe questions for the final human interview round.
- **Leaderboard:** Filterable applicant management table (`REGISTERED`, `IN_PROGRESS`, `COMPLETED_SCREENING`, `EVALUATED`, `SHORTLISTED`, `REJECTED`).

---

## 🛠️ Tech Stack & Architecture

- **Web Framework:** [Next.js 15](https://nextjs.org/) (App Router, React 19, TypeScript strict mode, standalone output).
- **Styling & UI:** [Tailwind CSS v4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/) components, and [Lucide Icons](https://lucide.dev/).
- **Database & ORM:** [PostgreSQL 16](https://www.postgresql.org/) (with `pgvector/pgvector:pg16`), [Prisma ORM](https://www.prisma.io/).
- **AI Engine:** [Vercel AI SDK](https://sdk.vercel.ai/) (`ai`) with Zod-enforced structured outputs.
  - Multi-provider flexibility: **OpenRouter**, **Google Gemini**, or **OpenAI**.
- **Deployment:** Docker & Docker Compose with multi-stage non-root container runner.

---

## 📂 Repository Structure

```text
├── Dockerfile                  # Multi-stage production container build (Node 22 Alpine)
├── docker-compose.yml          # Container orchestration (matchlab-app & matchlab-db)
├── docker-entrypoint.sh        # Container startup migration runner
├── prisma/
│   ├── schema.prisma           # Prisma schema (Organization, JobRequisition, Candidate, etc.)
│   └── migrations/             # Database migration history
├── public/                     # Static assets and icons
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/health/         # Container health check endpoint
│   │   ├── apply/[slug]/       # Flow B: Candidate interview page
│   │   ├── dashboard/          # Flow A & C: Management dashboard
│   │   │   └── jobs/
│   │   │       ├── new/        # Job requisition creator
│   │   │       └── [id]/       # Job detail and leaderboard
│   │   ├── globals.css         # Theme tokens and global styling
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Landing page
│   ├── components/             # Reusable UI primitives (Button, Card, Badge, etc.)
│   ├── lib/
│   │   ├── db.ts               # Prisma client singleton
│   │   └── ai/                 # AI SDK configurations, provider factory, and schemas
│   │       ├── models.ts       # Model resolver (OpenRouter, Gemini, OpenAI)
│   │       ├── schemas.ts      # Zod validation schemas for rubrics and evaluations
│   │       ├── translator.ts   # Flow A translation prompt & generation
│   │       ├── interviewer.ts  # Flow B conversational interview agent
│   │       └── evaluator.ts    # Flow C rubric-based transcript evaluation
│   └── modules/                # Feature-sliced domain modules
│       ├── requisition/        # Job requisition logic, forms, and actions
│       ├── screening/          # Interview chat session, message handling, and state
│       └── evaluation/         # Candidate scoring, leaderboard, and review views
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

# Public URL (for shareable candidate links)
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

4. **Stop Services:**
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

2. **Start the Database Only (via Docker):**
   ```bash
   docker compose up -d db
   ```

3. **Generate Prisma Client and Run Migrations:**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛡️ Guardrails & Safety Controls

- **Hard Turn Limit:** Server enforces `MAX_INTERVIEW_TURNS = 8` (configurable between 4–12 in job requisition) before any LLM API call is triggered.
- **Input Sanitization:** Candidate responses are restricted to a maximum of 1,200 characters and encapsulated inside `<candidate_input>` XML tags to resist prompt injection or jailbreak attempts.
- **Type Safety:** Strict schema validation with Zod across AI inputs/outputs and Prisma database records, avoiding untyped payload propagation.
- **Non-Colliding Host Ports:** Mapped to application port `3005` and database port `5435` to avoid conflicts on multi-tenant production and staging servers.

---

## 🧪 Verification & Maintenance Commands

```bash
# Validate Prisma schema
npx prisma validate

# Run TypeScript compilation check
npm run typecheck

# Run linter
npm run lint

# Production build check
npm run build
```

---

## 📄 License

This project is licensed under the MIT License.
