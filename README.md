# MatchLab 🔬🤖

> **Production-Grade Multi-Tenant SaaS, Talent Marketplace & Conversational Early Screening Platform**  
> Built for tech startups, university research laboratories (e.g., ASE Lab), and fast-growing businesses across Indonesia.

---

## 📌 Problem & Overview

Small organizations, academic labs, and fast-growing tech startups face recurrent hiring bottlenecks:
- **Busy Technical Leads:** Division heads and lab leads lack the time to conduct dozens of 1-on-1 preliminary interviews.
- **Context Gap:** Non-technical HR or administrative staff cannot probe deep, cross-domain technical concepts.
- **Form & CV Limitations:** Static Google Forms and CVs capture only superficial credentials (GPA, buzzwords) while missing critical work habits, async communication, ownership, and composure under pressure.

**MatchLab** solves this by delivering an end-to-end, multi-tenant SaaS platform with a three-stage conversational AI pipeline:
1. **Translates informal recruiter wishlists** into structured rubrics and scenario dilemmas.
2. **Conducts dynamic, scenario-based interviews** directly with candidates via an 8-turn interactive chat agent.
3. **Evaluates transcripts objectively** with evidence-backed green/red flags, domain & implicit behavior scoring, and ranked leaderboards.
4. **Unifies candidate profiles** across multiple organizations in an open talent marketplace with dedicated role-based portals.
5. **Full self-serve SaaS lifecycle:** Authentication, multi-tenant onboarding, team invitations, Midtrans payments (QRIS/VA), quota enforcement, and Super Admin governance.

---

## 👥 Platform Actors & RBAC

MatchLab implements strict multi-tier Role-Based Access Control (RBAC):

| Role | System Role | Org Role | Key Capabilities & Accessible Routes |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `SUPER_ADMIN` | — | Platform governance, tenant verification/suspension, plan tier adjustments, applicant quotas, user moderation, revenue tracking, cross-tenant invoices, and audit logging (`/super-admin`, `/super-admin/billing`, `/super-admin/audit`). |
| **Org Admin** | `COMPANY_USER` | `ORG_ADMIN` | Tenant administration, company culture description, applicant quota monitoring, Midtrans checkout & billing, team invitations & seat management, and requisition oversight (`/dashboard`, `/dashboard/team`, `/dashboard/billing`, `/dashboard/settings`). |
| **Division Lead** | `COMPANY_USER` | `DIVISION_LEAD` | Technical job requisition creation via AI requirement translation (Flow A), candidate leaderboard review, transcript inspection, and hiring status updates (`/dashboard/jobs/new`, `/dashboard/jobs/[id]`). |
| **Job Seeker** | `JOB_SEEKER` | — | Reusable candidate profile, public job discovery, application status tracking, scorecard feedback review, and 8-turn conversational screening (`/candidate/dashboard`, `/candidate/profile`, `/jobs`, `/apply/[slug]`). |

---

## 💳 SaaS Subscription Plans & Pricing

MatchLab offers three pricing tiers tailored for the Indonesian market with billing in Indonesian Rupiah (IDR):

| Feature | Free (`FREE`) | Pay-per-Oprec (`PAY_PER_OPREC`) | SME Pro (`SME_PRO`) |
| :--- | :--- | :--- | :--- |
| **Harga** | **Rp 0** | **Rp 149.000** / oprec | **Rp 499.000** / bulan |
| **Kuota Pelamar** | 20 pelamar | 150 pelamar / paket | 750 pelamar / bulan |
| **Lowongan Aktif** | Maks. 1 lowongan | Maks. 3 lowongan | Unlimited |
| **Anggota Tim** | Maks. 2 anggota | Maks. 5 anggota | Unlimited |
| **Payment Gateway** | — | Midtrans Snap (QRIS, VA, Kartu) | Midtrans Snap (QRIS, VA, Kartu) |
| **Siklus Kuota** | One-time allowance | Akumulatif per pembelian | Reset 30 hari |
| **Cocok Untuk** | Uji coba lab & UMKM baru | Rekrutmen batch/musiman (UKM/Event) | Perusahaan & lab riset aktif |

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
│ Cross-org KPIs, │ │ Reusable profile│
│ Billing & Audit │ │ & multi-app hub │
└─────────────────┘ └─────────────────┘
```

### 1. Flow A: AI Requirement Translator (Division Lead / Org Admin)
- **Input:** Recruiter enters colloquial requirements (e.g., *"Butuh asisten lab yang paham Docker, Linux kernel tuning, distributed KV store, dan siap jaga on-call"*).
- **Processing:** AI translates unstructured text into structured criteria, domain/implicit weights, and non-Googleable scenario dilemmas.
- **Output:** Configurable requisition with a shareable public URL (`/apply/[slug]`). Rate-limited to prevent abuse.

### 2. Flow B: Conversational Early Screening (Candidate Experience)
- **Application:** Candidate signs up or logs in with their reusable `CandidateProfile`.
- **Interactive Interview:** AI conducts a dynamic, scenario-based chat session strictly capped at **8 turns**:
  - **Turns 1–3:** Technical depth and practical domain problem-solving.
  - **Turns 4–7:** Work habits, async communication, ownership, and response to crunch/stress.
  - **Turn 8:** Graceful interview conclusion and handoff.
- **Atomic Quota Consumption:** When a candidate starts screening, `consumeApplicantQuota` atomically checks and decrements the organization's allowance within a database transaction.

### 3. Flow C: Decision Hub & Leaderboard (Division Lead / Org Admin)
- **Scoring Engine:** AI evaluates full interview transcripts against the job's defined rubric.
- **Comprehensive Scorecard:**
  - Overall `MatchScore` (0–100 weighted composite).
  - `DomainScore` & `ImplicitBehaviorScore` sub-breakdowns.
  - Evidence quotes cited directly from candidate statements.
  - Identified **Green Flags** and **Red Flags**.
  - Executive summary and tailored probe questions for the final human interview round.
- **Leaderboard:** Filterable applicant management table (`ALL`, `SHORTLISTED`, `EVALUATED`, `IN_PROGRESS`, `REGISTERED`, `REJECTED`).

### 4. Flow D: Platform Governance, Billing & Audit (Super Admin)
- Cross-tenant KPI cards: Total Companies, Total Job Seekers, Total Active Jobs, and Total Revenue (IDR).
- Organization verification, plan adjustments, quota editor, and instant suspension toggle.
- **Billing Telemetry (`/super-admin/billing`):** Overview of all Midtrans payments and invoices across all organizations.
- **Audit Log (`/super-admin/audit`):** Immutable log of security, auth, org, job, and billing events with metadata inspection.

### 5. Flow E: Talent Marketplace & Candidate Portal (Job Seeker)
- **Public Job Board (`/jobs`):** Explore open requisitions across verified organizations with skill tags.
- **Candidate Dashboard (`/candidate/dashboard`):** Track application statuses across multiple organizations.
- **Candidate Profile (`/candidate/profile`):** Maintain a reusable CV summary, portfolio link, skills tags, and talent pool availability toggle.

---

## 🔒 Security & SaaS Architecture

1. **Authentication & Session Management:**
   - Password hashing via `crypto.scrypt` with a unique 16-byte cryptographically secure salt per user (stored in format `scrypt:<salt>:<hash>`).
   - Backward-compatible upgrade path for legacy static-salt passwords upon successful login.
   - Database-backed `Session` table: session cookies hold a random 256-bit URL-safe token; only its SHA-256 hash is stored in the database.
   - Sliding 30-day session expiry refreshed on active requests.
   - Session revocation: Password changes and Super Admin user suspensions immediately revoke all active sessions.

2. **Tenant Isolation:**
   - Strict server-side assertion guards in `src/lib/auth/guards.ts` (`assertOrgAccess`, `assertJobAccess`, `assertApplicationAccess`, `assertJobSeeker`).
   - Organization data is strictly scoped by `organizationId`. Cross-tenant data leakage is structurally impossible.

3. **Rate Limiting:**
   - In-memory sliding window rate limiter protects sensitive endpoints:
     - Login: 10 attempts / 15 minutes.
     - Signup: 5 attempts / 1 hour.
     - Forgot Password: 3 requests / 1 hour.
     - AI Translation: 10 requests / 10 minutes.
     - Candidate Chat: 30 messages / minute.

4. **Payments & Idempotency:**
   - Midtrans Snap integration supporting QRIS, Bank Transfer / Virtual Accounts (BCA, Mandiri, BNI, BRI, Permata), and Credit Cards.
   - Midtrans SHA-512 signature verification on webhook notifications.
   - Fully idempotent fulfillment: repeated notifications will not double-grant applicant quota.

5. **Transactional Emails:**
   - Resend REST API integration (`src/lib/email/index.ts`) for email verification, password reset, team invitations, and payment receipts.
   - Safe local fallback: If `RESEND_API_KEY` is not provided, emails are logged to the console with direct action links.

6. **Legal & Compliance:**
   - Terms of Service (`/terms`) and Privacy Policy (`/privacy`) compliant with Indonesian Personal Data Protection Law (**UU PDP No. 27/2022**).

---

## 🔑 Seeded Accounts (For Testing & Verification)

Seed data provides pre-configured accounts representing all roles and tiers:

| Role | Name | Email | Password | Organization / Plan | Default Portal |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | MatchLab Super Admin | `admin@matchlab.id` | `admin123` | Platform-wide | `/super-admin` |
| **Org Admin** | Dr. Hendra Wibowo | `hendra@aselab.id` | `aselab123` | ASE Research Lab (`SME_PRO`) | `/dashboard` |
| **Division Lead** | Budi Santoso | `budi@aselab.id` | `aselab123` | ASE Research Lab (`SME_PRO`) | `/dashboard` |
| **Org Admin** | Siti Rahma | `siti@nusantaratech.id` | `nusantara123` | Nusantara Tech (`PAY_PER_OPREC`) | `/dashboard` |
| **Org Admin** | Maya Indah | `maya@kreasimuda.co.id` | `kreasi123` | PT Kreasi Digital Muda (`FREE`) | `/dashboard` |
| **Job Seeker** | Dewi Lestari | `dewi@example.com` | `dewi123` | Candidate (Shortlisted) | `/candidate/dashboard` |
| **Job Seeker** | Fajar Pratama | `fajar@example.com` | `fajar123` | Candidate (Evaluated) | `/candidate/dashboard` |
| **Job Seeker** | Bagas Pratama | `bagas@example.com` | `bagas123` | Candidate (Shortlisted) | `/candidate/dashboard` |
| **Job Seeker** | Aisyah Putri | `aisyah@example.com` | `aisyah123` | Candidate (Evaluated) | `/candidate/dashboard` |
| **Job Seeker** | Dimas Suryo | `dimas@example.com` | `dimas123` | Candidate (Fresh / Registered) | `/candidate/dashboard` |

> *Note: Seed credentials can be overridden via `SEED_SUPER_ADMIN_EMAIL` and `SEED_SUPER_ADMIN_PASSWORD`. Setting `SEED_SAMPLE_DATA=false` will only create the Super Admin account and skip demo data.*

---

## 🛠️ Tech Stack & Architecture

- **Web Framework:** [Next.js 15](https://nextjs.org/) (App Router, React 19, TypeScript strict mode, standalone output).
- **Styling & UI:** [Tailwind CSS v4](https://tailwindcss.com/), Radix UI / Base UI primitives, [Lucide Icons](https://lucide.dev/).
- **Database & ORM:** [PostgreSQL 16](https://www.postgresql.org/) (with `pgvector/pgvector:pg16`), [Prisma ORM](https://www.prisma.io/).
- **Payment Gateway:** [Midtrans Snap](https://midtrans.com/) (QRIS, VA, Credit Card).
- **Email Service:** [Resend](https://resend.com/) REST API with HTML templates and dev fallback.
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
│   ├── schema.prisma           # Multi-tenant SaaS schema (User, Session, Invoice, AuditLog, etc.)
│   ├── migrations/             # Database migration history
│   └── seed.ts                 # Configurable SaaS seed script
├── public/                     # Static assets and icons
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Real auth routes (/login, /signup, /verify-email, etc.)
│   │   ├── (public)/           # Landing page (/), /pricing, /terms, /privacy
│   │   ├── account/            # User account settings & password management
│   │   ├── onboarding/         # New organization self-serve onboarding
│   │   ├── invite/[token]/     # Team invitation acceptance
│   │   ├── apply/[slug]/       # Candidate conversational interview page
│   │   ├── candidate/          # Job Seeker Portal (/dashboard, /profile)
│   │   ├── dashboard/          # Organization Dashboard
│   │   │   ├── jobs/           # Job creator (Flow A) & detail/leaderboard (Flow C)
│   │   │   ├── team/           # Team members & invitations
│   │   │   ├── billing/        # Plan quota & Midtrans checkout
│   │   │   └── settings/       # Organization branding & culture profile
│   │   ├── jobs/               # Public multi-organization job board
│   │   ├── super-admin/        # Platform Governance
│   │   │   ├── billing/        # Cross-tenant invoices overview
│   │   │   └── audit/          # Immutable security & audit log
│   │   └── api/
│   │       ├── health/         # Container health check endpoint
│   │       └── billing/midtrans/notification/ # Midtrans webhook handler
│   ├── components/             # UI primitives & layouts
│   │   ├── layout/             # PublicHeader, SiteFooter
│   │   └── auth/               # UserMenu, forms
│   ├── lib/
│   │   ├── db.ts               # Prisma client singleton
│   │   ├── audit.ts            # AuditLog writer & canonical action constants
│   │   ├── rate-limit.ts       # In-memory sliding window rate limiter
│   │   ├── request.ts          # IP, User-Agent, and App URL resolver
│   │   ├── auth/               # Session management, guards, scrypt hashing, tokens
│   │   ├── billing/            # Plans definition, Midtrans client, quota management
│   │   ├── email/              # Resend client & transactional email templates
│   │   └── ai/                 # Vercel AI SDK integration (Translator, Interviewer, Evaluator)
│   ├── middleware.ts           # Security headers & edge protection
│   └── modules/                # Feature-sliced domain modules (auth, billing, team, etc.)
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

# LLM Provider Setup (OpenRouter / Gemini / OpenAI)
AI_PROVIDER="openrouter"
OPENROUTER_API_KEY="sk-or-v1-..."
AI_MODEL_TRANSLATOR="google/gemini-2.5-flash"
AI_MODEL_INTERVIEWER="google/gemini-2.5-flash"
AI_MODEL_EVALUATOR="google/gemini-2.5-pro"

# Transactional Email (Resend) - Leave blank for console logging in dev
RESEND_API_KEY=""
EMAIL_FROM="MatchLab <no-reply@matchlab.yourdomain.id>"

# Midtrans Payments - Sandbox keys start with SB-
MIDTRANS_SERVER_KEY=""
MIDTRANS_CLIENT_KEY=""
MIDTRANS_IS_PRODUCTION="false"

# Support Contact for Terms & Privacy
SUPPORT_EMAIL="support@matchlab.yourdomain.id"
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

4. **Seed the Database:**
   ```bash
   npm run seed
   ```

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 💳 Midtrans Webhook Setup & Sandbox Testing

1. In the [Midtrans Sandbox Dashboard](https://dashboard.sandbox.midtrans.com/):
   - Navigate to **Settings > Configuration**.
   - Set **Payment Notification URL** to:
     `https://<your-domain>/api/billing/midtrans/notification`
     *(For local testing, use Cloudflare Tunnel, ngrok, or local forwarding).*
2. To simulate a payment callback manually:
   - Use the **Midtrans Payment Simulator** or trigger a test QRIS/VA transaction via `/dashboard/billing`.
   - The webhook endpoint validates the SHA-512 signature (`order_id + status_code + gross_amount + server_key`), transitions the `Invoice` status to `PAID`, updates the organization's quota, and creates an `AuditLog` entry.

---

## 🧪 Verification & Maintenance Commands

```bash
# Validate Prisma schema
npx prisma validate

# Run TypeScript compilation check
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
