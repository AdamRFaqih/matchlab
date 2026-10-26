import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModelV1 } from "ai";

export type AiProviderType = "openrouter" | "openai" | "google";

/**
 * Normalizes a model identifier for OpenRouter (e.g. "gemini-2.5-flash" -> "google/gemini-2.5-flash")
 */
export function normalizeOpenRouterModel(model: string): string {
  // Strip "openrouter/" or "openrouter:" prefix if present
  const clean = model.replace(/^openrouter[:/]/i, "").trim();

  // If already formatted as "vendor/model", keep it
  if (clean.includes("/")) {
    return clean;
  }

  // Prepend vendor prefix for common known shorthands
  if (clean.startsWith("gemini")) {
    return `google/${clean}`;
  }
  if (clean.startsWith("gpt") || clean.startsWith("o1") || clean.startsWith("o3")) {
    return `openai/${clean}`;
  }
  if (clean.startsWith("claude")) {
    return `anthropic/${clean}`;
  }
  if (clean.startsWith("llama")) {
    return `meta-llama/${clean}`;
  }
  if (clean.startsWith("deepseek")) {
    return `deepseek/${clean}`;
  }
  if (clean.startsWith("qwen")) {
    return `qwen/${clean}`;
  }
  if (clean.startsWith("mistral")) {
    return `mistralai/${clean}`;
  }

  return clean;
}

/**
 * Determines the target AI provider based on environment variables and model format.
 */
export function resolveAiProvider(configuredModel: string): {
  provider: AiProviderType;
  apiKey: string | null;
} {
  const genericKey = process.env.AI_PROVIDER_API_KEY?.trim();
  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
  const openAiKey = process.env.OPENAI_API_KEY?.trim();
  const googleKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    process.env.GEMINI_API_KEY?.trim();

  const isInvalidKey = (k?: string) => !k || k === "your_api_key_here";

  const explicitProvider = process.env.AI_PROVIDER?.trim().toLowerCase();

  // 1. Explicit provider via AI_PROVIDER
  if (explicitProvider === "openrouter") {
    const key = (!isInvalidKey(openRouterKey) ? openRouterKey : null) || (!isInvalidKey(genericKey) ? genericKey : null);
    return { provider: "openrouter", apiKey: key || null };
  }
  if (explicitProvider === "openai") {
    const key = (!isInvalidKey(openAiKey) ? openAiKey : null) || (!isInvalidKey(genericKey) ? genericKey : null);
    return { provider: "openai", apiKey: key || null };
  }
  if (explicitProvider === "google" || explicitProvider === "gemini") {
    const key = (!isInvalidKey(googleKey) ? googleKey : null) || (!isInvalidKey(genericKey) ? genericKey : null);
    return { provider: "google", apiKey: key || null };
  }

  // 2. OpenRouter indicators:
  // - OpenRouter specific key set
  // - Generic key has sk-or- prefix
  // - Model has openrouter prefix or contains a slash "vendor/model" (e.g. meta-llama/..., google/..., deepseek/...)
  const hasOpenRouterModelFormat =
    configuredModel.startsWith("openrouter/") ||
    configuredModel.startsWith("openrouter:") ||
    configuredModel.includes("/");

  const hasOpenRouterKey =
    (!isInvalidKey(openRouterKey)) ||
    (!isInvalidKey(genericKey) && genericKey!.startsWith("sk-or-"));

  if (hasOpenRouterModelFormat || hasOpenRouterKey) {
    const key = (!isInvalidKey(openRouterKey) ? openRouterKey : null) || (!isInvalidKey(genericKey) ? genericKey : null);
    return { provider: "openrouter", apiKey: key || null };
  }

  // 3. OpenAI indicators:
  // - OPENAI_API_KEY set
  // - Model starts with "gpt", "o1", "o3"
  if (!isInvalidKey(openAiKey) || configuredModel.startsWith("gpt") || configuredModel.startsWith("o1") || configuredModel.startsWith("o3")) {
    const key = (!isInvalidKey(openAiKey) ? openAiKey : null) || (!isInvalidKey(genericKey) ? genericKey : null);
    return { provider: "openai", apiKey: key || null };
  }

  // 4. Google indicators:
  // - Google key set
  // - Model starts with "gemini"
  if (!isInvalidKey(googleKey) || configuredModel.startsWith("gemini")) {
    const key = (!isInvalidKey(googleKey) ? googleKey : null) || (!isInvalidKey(genericKey) ? genericKey : null);
    return { provider: "google", apiKey: key || null };
  }

  // 5. Fallback generic key resolution
  const fallbackKey = !isInvalidKey(genericKey) ? genericKey! : null;
  return { provider: "google", apiKey: fallbackKey };
}

/**
 * Returns a configured LanguageModel instance from Vercel AI SDK.
 * Supports OpenRouter, Google Generative AI, and OpenAI.
 */
export function getAiModel(
  modelEnvKey = "AI_MODEL_INTERVIEWER",
  defaultModel = "gemini-2.5-flash"
): LanguageModelV1 | null {
  const configuredModel = process.env[modelEnvKey]?.trim() || defaultModel;
  const { provider, apiKey } = resolveAiProvider(configuredModel);

  if (!apiKey) {
    return null;
  }

  if (provider === "openrouter") {
    const openrouter = createOpenRouter({
      apiKey,
      baseURL: process.env.OPENROUTER_BASE_URL || undefined,
      headers: {
        "HTTP-Referer":
          process.env.OPENROUTER_HTTP_REFERER ||
          process.env.NEXT_PUBLIC_APP_URL ||
          "https://matchlab.local",
        "X-Title": process.env.OPENROUTER_TITLE || "MatchLab",
      },
    });

    const modelId = normalizeOpenRouterModel(configuredModel);
    return openrouter(modelId);
  }

  if (provider === "openai") {
    const openai = createOpenAI({
      apiKey,
      baseURL: process.env.OPENAI_BASE_URL || undefined,
    });
    return openai(
      configuredModel.startsWith("gpt") || configuredModel.startsWith("o1") || configuredModel.startsWith("o3")
        ? configuredModel
        : "gpt-4o-mini"
    );
  }

  // Google provider
  const google = createGoogleGenerativeAI({
    apiKey,
    baseURL: process.env.GOOGLE_GENERATIVE_AI_BASE_URL || undefined,
  });
  return google(configuredModel);
}
