import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";

export function getAiModel(modelEnvKey = "AI_MODEL_INTERVIEWER", defaultModel = "gemini-2.5-flash") {
  const apiKey =
    process.env.AI_PROVIDER_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey === "your_api_key_here") {
    return null;
  }

  const configuredModel = process.env[modelEnvKey] || defaultModel;

  if (process.env.OPENAI_API_KEY || configuredModel.startsWith("gpt")) {
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY || apiKey,
    });
    return openai(configuredModel.startsWith("gpt") ? configuredModel : "gpt-4o-mini");
  }

  const google = createGoogleGenerativeAI({
    apiKey,
  });
  return google(configuredModel);
}
