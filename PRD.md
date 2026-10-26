# Product Requirements Document (PRD): MatchLab MVP

## 1. Problem Statement
Small organizations, university labs (e.g., ASE Lab), student organizations (UKM), and early-stage SMEs lack dedicated technical recruiters.
- Division leads/lab heads are too busy to interview dozens of applicants 1-on-1.
- Admin/HR staff do not understand cross-domain technical requirements.
- Static Google Forms only capture explicit data (GPA, CV links) and fail to capture implicit traits (work habits, ownership, problem-solving behavior, personality).

## 2. Core User Flows (MVP Scope)

### Flow A: AI Requirement Translator (Internal Lead / User)
1. Division Lead creates a new Job Requisition and inputs a casual description of who they need (e.g., *"Butuh asisten lab yang ngerti dasar Docker & Linux, inisiatif tinggi, gak gampang hilang pas minggu ujian"*).
2. AI translates this raw input into a structured `JobSpecification` & `ScoringRubric`:
   - **Explicit/Domain Criteria** (weights, required concepts to probe).
   - **Implicit Behavioral Criteria** (work habits, communication style, red flags to watch out for).
   - **Scenario Prompts** (3 custom situational questions for the AI interviewer to ask).
3. Lead reviews/edits the generated rubric and publishes the job to get a shareable `/apply/[slug]` link.

### Flow B: Conversational Early Screening (External Candidate)
1. Candidate opens `/apply/[slug]`, enters basic profile info (Name, Email, Portfolio/CV summary text).
2. Candidate enters an interactive chat room powered by the AI Interviewer.
3. The AI conducts a natural, scenario-based interview (strictly capped at **8 turns**):
   - Turns 1–3: Probe domain/technical understanding using practical scenarios.
   - Turns 4–7: Probe implicit work habits, team dynamics, and stress response.
   - Turn 8: Wrap up and thank the candidate.
4. Once `turnCount >= 8`, the chat locks automatically and triggers the background Evaluation Job.

### Flow C: Two-Way Matchmaking & Decision Hub (HR / Lead Decision)
1. The AI Evaluator analyzes the full transcript against the job's `ScoringRubric`.
2. It generates a structured `CandidateEvaluation`:
   - Overall `matchScore` (0–100).
   - Breakdown of `domainScore` (0–100) and `implicitBehaviorScore` (0–100).
   - Extracted `greenFlags` (evidence-backed strengths) and `redFlags` (inconsistencies, flaky habits, shallow answers).
   - Executive summary (3–4 sentences) + recommended follow-up questions for the final human interview.
3. HR/Lead views a ranked Leaderboard of candidates, filters by status (`SHORTLISTED`, `REJECTED`), and schedules final human interviews.
