import assert from "node:assert/strict";
import { normalizeAiUsage } from "../src/lib/ai/usage";

assert.deepEqual(normalizeAiUsage({ promptTokens: 12, completionTokens: 8 }), {
  promptTokens: 12,
  completionTokens: 8,
  totalTokens: 20,
});

assert.deepEqual(normalizeAiUsage({ prompt_tokens: 4, completion_tokens: 3, total_tokens: 9 }), {
  promptTokens: 4,
  completionTokens: 3,
  totalTokens: 9,
});

assert.deepEqual(normalizeAiUsage({ promptTokens: 5, completionTokens: 3, totalTokens: 0 }), {
  promptTokens: 5,
  completionTokens: 3,
  totalTokens: 8,
});

assert.deepEqual(
  normalizeAiUsage({
    promptTokens: -1,
    completionTokens: Number.NaN,
    totalTokens: Number.POSITIVE_INFINITY,
  }),
  {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  }
);

assert.deepEqual(normalizeAiUsage(undefined), {
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
});

console.log("usage normalization tests passed");
