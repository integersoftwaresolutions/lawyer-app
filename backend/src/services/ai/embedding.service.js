import { aiConfig } from "../../config/ai.config.js";
import { AI_USAGE_TYPES } from "../../config/constants.js";
import * as openaiClient from "./openai.client.js";
import * as usageService from "./usage.service.js";

/** Soft cap to avoid request payload limits / per-request token caps. */
const EMBED_BATCH_SIZE = 96;

/**
 * Generate embeddings for a list of strings.
 * Logs an `AiUsageLog` row of type EMBEDDING when `userId` is supplied.
 *
 * @param {string[]} inputs
 * @param {object} options
 * @param {string} [options.userId]    - lawyerId / userId to attribute usage to
 * @param {string} [options.model]     - override embedding model
 * @param {object} [options.metadata]  - extra metadata for the usage log entry
 * @returns {Promise<{ embeddings: number[][], model: string, usage: object }>}
 */
export async function embedTexts(inputs, options = {}) {
  if (!Array.isArray(inputs) || inputs.length === 0) {
    return { embeddings: [], model: options.model || aiConfig.embeddingModel, usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 } };
  }

  const cleaned = inputs.map((s) => String(s || "").trim()).filter(Boolean);
  if (cleaned.length === 0) {
    return { embeddings: [], model: options.model || aiConfig.embeddingModel, usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 } };
  }

  const allEmbeddings = [];
  let aggregatePrompt = 0;
  let aggregateCompletion = 0;
  let aggregateTotal = 0;
  let modelUsed = options.model || aiConfig.embeddingModel;

  for (let i = 0; i < cleaned.length; i += EMBED_BATCH_SIZE) {
    const batch = cleaned.slice(i, i + EMBED_BATCH_SIZE);
    const result = await openaiClient.embed(batch, { model: options.model });
    allEmbeddings.push(...result.embeddings);
    aggregatePrompt += result.usage.promptTokens || 0;
    aggregateCompletion += result.usage.completionTokens || 0;
    aggregateTotal += result.usage.totalTokens || 0;
    modelUsed = result.model || modelUsed;
  }

  if (options.userId) {
    await usageService.record({
      userId: options.userId,
      type: AI_USAGE_TYPES.EMBEDDING,
      model: modelUsed,
      promptTokens: aggregatePrompt,
      completionTokens: aggregateCompletion,
      totalTokens: aggregateTotal,
      metadata: { source: "embedding", count: cleaned.length, ...(options.metadata || {}) }
    });
  }

  return {
    embeddings: allEmbeddings,
    model: modelUsed,
    usage: {
      promptTokens: aggregatePrompt,
      completionTokens: aggregateCompletion,
      totalTokens: aggregateTotal
    }
  };
}

export async function embedQuery(text, options = {}) {
  const result = await embedTexts([text], options);
  return {
    embedding: result.embeddings[0] || [],
    model: result.model,
    usage: result.usage
  };
}
