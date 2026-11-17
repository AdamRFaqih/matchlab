export interface AiUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export const EMPTY_AI_USAGE: AiUsage = {
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
};

function nonNegativeInt(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : 0;
}

export function normalizeAiUsage(raw: unknown): AiUsage {
  if (!raw || typeof raw !== "object") return EMPTY_AI_USAGE;

  const usage = raw as Record<string, unknown>;
  const promptTokens = nonNegativeInt(usage.promptTokens ?? usage.prompt_tokens);
  const completionTokens = nonNegativeInt(
    usage.completionTokens ?? usage.completion_tokens
  );
  const reportedTotal = nonNegativeInt(usage.totalTokens ?? usage.total_tokens);

  return {
    promptTokens,
    completionTokens,
    totalTokens: reportedTotal || promptTokens + completionTokens,
  };
}
