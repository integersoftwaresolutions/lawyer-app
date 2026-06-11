import { aiConfig, isOpenAiConfigured } from "../../config/ai.config.js";
import { AI_USAGE_TYPES } from "../../config/constants.js";
import { ApiError } from "../../helpers/apiError.js";
import * as openaiClient from "./openai.client.js";
import * as usageService from "./usage.service.js";
import { isEncryptionConfigured } from "./encryption.util.js";

export async function healthCheck(userId) {
  if (!isOpenAiConfigured()) {
    throw new ApiError(503, "OpenAI is not configured. Set OPENAI_API_KEY.");
  }

  const dailyLimit = await usageService.getDailyLimit();
  const todayCount = await usageService.countTodayRequests(userId);

  const result = await openaiClient.chatComplete(
    [{ role: "user", content: "Reply with exactly: OK" }],
    { maxTokens: aiConfig.healthCheckMaxTokens, temperature: 0 }
  );

  const usageLog = await usageService.record({
    userId,
    type: AI_USAGE_TYPES.CHAT_COMPLETION,
    model: result.model,
    promptTokens: result.usage.promptTokens,
    completionTokens: result.usage.completionTokens,
    totalTokens: result.usage.totalTokens,
    metadata: { source: "health_check" }
  });

  return {
    connected: true,
    model: result.model,
    embeddingModel: aiConfig.embeddingModel,
    encryptionConfigured: isEncryptionConfigured(),
    dailyRequestLimit: dailyLimit,
    requestsToday: todayCount + 1,
    usageLogged: true,
    usageLogId: usageLog._id,
    promptTokens: result.usage.promptTokens,
    completionTokens: result.usage.completionTokens
  };
}

export async function getUsageSummary(userId, period = "month") {
  return usageService.getSummary(userId, period);
}
