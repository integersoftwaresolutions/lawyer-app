import { env } from "./env.js";

export const aiConfig = {
  apiKey: env.openaiApiKey,
  chatModel: env.openaiModel,
  embeddingModel: env.openaiEmbeddingModel,
  requestTimeoutMs: env.openaiRequestTimeoutMs,
  dailyRequestLimit: env.aiDailyRequestLimit,
  healthCheckMaxTokens: 5,
  billableUnitsPerThousandTokens: 1
};

export function isOpenAiConfigured() {
  return Boolean(aiConfig.apiKey);
}
