import { z } from "zod";

// 1. Output of the AI Requirement Translator (Flow A)
export const ScoringRubricSchema = z.object({
    roleSummary: z.string().describe("Clean, candidate-facing summary of the role and division expectations."),
    domainWeight: z.number().min(10).max(90).describe("Percentage weight for technical/domain competence (must sum to 100 with implicitWeight)."),
    implicitWeight: z.number().min(10).max(90).describe("Percentage weight for implicit habits, ownership, and personality."),
    domainCriteria: z.array(
        z.object({
            topic: z.string(),
            expectedDepth: z.string().describe("What a good answer looks like in practice."),
            probeQuestion: z.string().describe("Scenario-based question to test this concept without being easily Googleable."),
        })
    ).min(2).max(4),
    implicitCriteria: z.array(
        z.object({
            traitName: z.string().describe("e.g., Time Commitment Under Exam Pressure, Ownership, Async Communication"),
            positiveIndicators: z.array(z.string()),
            redFlagIndicators: z.array(z.string()),
            situationalDilemma: z.string().describe("A realistic dilemma question to uncover their true habit/behavior."),
        })
    ).min(2).max(4),
});

export type ScoringRubric = z.infer<typeof ScoringRubricSchema>;

export const JobSpecSchema = z.object({
    title: z.string().min(2),
    roleSummary: z.string(),
    targetAudience: z.string().optional(),
});

export type JobSpec = z.infer<typeof JobSpecSchema>;

export const CreateJobRequisitionInputSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    slug: z.string().optional(),
    rawUserPrompt: z.string().min(10, "Requirement description must be at least 10 characters"),
    organizationId: z.string().optional(),
    scoringRubric: ScoringRubricSchema,
    maxTurns: z.number().int().min(4).max(12).default(8),
});

export type CreateJobRequisitionInput = z.infer<typeof CreateJobRequisitionInputSchema>;

// 2. Output of the AI Matchmaking Evaluator (Flow C)
export const CandidateEvaluationSchema = z.object({
    domainScore: z.number().min(0).max(100),
    implicitBehaviorScore: z.number().min(0).max(100),
    matchScore: z.number().min(0).max(100).describe("Weighted overall match score based on rubric weights."),
    executiveSummary: z.string().describe("Concise 3-sentence verdict written in Indonesian for the Division Lead / HR."),
    traitBreakdown: z.array(
        z.object({
            criterion: z.string(),
            category: z.enum(["DOMAIN", "IMPLICIT"]),
            score: z.number().min(1).max(5),
            evidenceQuote: z.string().describe("Direct quote or observation from the candidate's chat transcript."),
            analysis: z.string(),
        })
    ),
    greenFlags: z.array(z.string()).describe("Specific positive behaviors or strong technical insights demonstrated."),
    redFlags: z.array(z.string()).describe("Evasive answers, AI-generated copy-paste patterns, or concerning work habits."),
    finalInterviewProbes: z.array(z.string()).max(3).describe("Targeted questions for the human interviewer to verify in the final round."),
});

export type CandidateEvaluation = z.infer<typeof CandidateEvaluationSchema>;
