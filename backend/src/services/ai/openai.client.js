import OpenAI from "openai";
import { aiConfig, isOpenAiConfigured } from "../../config/ai.config.js";
import { ApiError } from "../../helpers/apiError.js";

let client = null;

function getClient() {
  if (!isOpenAiConfigured()) {
    throw new ApiError(503, "OpenAI is not configured. Set OPENAI_API_KEY.");
  }
  if (!client) {
    client = new OpenAI({
      apiKey: aiConfig.apiKey,
      timeout: aiConfig.requestTimeoutMs
    });
  }
  return client;
}

function normalizeUsage(usage = {}) {
  const promptTokens = usage.prompt_tokens ?? usage.promptTokens ?? 0;
  const completionTokens = usage.completion_tokens ?? usage.completionTokens ?? 0;
  const totalTokens = usage.total_tokens ?? usage.totalTokens ?? promptTokens + completionTokens;

  return { promptTokens, completionTokens, totalTokens };
}

export async function chatComplete(messages, options = {}) {
  const openai = getClient();
  const model = options.model || aiConfig.chatModel;

  const response = await openai.chat.completions.create({
    model,
    messages,
    max_tokens: options.maxTokens,
    temperature: options.temperature ?? 0.3,
    store: false
  });

  const choice = response.choices?.[0];
  const content = choice?.message?.content ?? "";
  const usage = normalizeUsage(response.usage);

  return { content, usage, model: response.model || model };
}

export async function embed(input, options = {}) {
  const openai = getClient();
  const model = options.model || aiConfig.embeddingModel;
  const inputs = Array.isArray(input) ? input : [input];

  // Note: `store` is a chat-completions parameter and is rejected on the
  // embeddings endpoint. `encoding_format: "float"` ensures we receive number
  // arrays (some SDK builds default to "base64" otherwise).
  const response = await openai.embeddings.create({
    model,
    input: inputs,
    encoding_format: "float"
  });

  const usage = normalizeUsage(response.usage);
  const embeddings = (response.data || []).map((item) => item.embedding);

  return {
    embeddings,
    usage,
    model: response.model || model
  };
}

export { isOpenAiConfigured };
