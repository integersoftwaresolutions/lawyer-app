import { ApiError } from "../../helpers/apiError.js";
import AiMessage from "../../models/AiMessage.js";
import { AI_USAGE_TYPES } from "../../config/constants.js";
import * as chatEngine from "./chatEngine.service.js";
import * as sessionService from "./session.service.js";
import * as usageService from "./usage.service.js";
import { encrypt, decrypt, isEncryptionConfigured } from "./encryption.util.js";
import { getModeStrategy } from "./modes/index.js";

const MAX_HISTORY_MESSAGES = 40;

function formatMessage(doc) {
  return {
    id: doc._id,
    sessionId: doc.sessionId,
    role: doc.role,
    content: decrypt(doc.content),
    citations: doc.citations || [],
    tokenUsage: doc.tokenUsage || {},
    metadata: doc.metadata || {},
    createdAt: doc.createdAt
  };
}

async function loadHistory(sessionId) {
  const rows = await AiMessage.find({ sessionId })
    .sort({ createdAt: 1 })
    .limit(MAX_HISTORY_MESSAGES)
    .lean();

  return rows
    .filter((row) => row.role === "user" || row.role === "assistant")
    .map((row) => ({
      role: row.role,
      content: decrypt(row.content)
    }));
}

export async function listMessages(sessionId) {
  const rows = await AiMessage.find({ sessionId }).sort({ createdAt: 1 }).lean();
  return rows.map(formatMessage);
}

export async function sendMessage({ sessionId, lawyerId, workspaceId = null, content, options = {} }) {
  if (!isEncryptionConfigured()) {
    throw new ApiError(500, "Message encryption is not configured. Set ENCRYPTION_KEY.");
  }

  const session = await sessionService.getOwnedSession(sessionId, lawyerId, workspaceId);

  if (workspaceId) {
    const { assertCanUseAi } = await import("../../billing/entitlement.service.js");
    await assertCanUseAi(workspaceId);
  }

  const dailyLimit = await usageService.getDailyLimit();
  const todayCount = await usageService.countTodayRequests(lawyerId);
  if (todayCount >= dailyLimit) {
    throw new ApiError(429, `Daily AI request limit reached (${dailyLimit}). Try again tomorrow.`);
  }

  const strategy = getModeStrategy(session.mode);
  const history = await loadHistory(sessionId);
  const userTurn = { role: "user", content: String(content).trim() };

  if (!userTurn.content) {
    throw new ApiError(400, "Message content is required");
  }

  const context = await strategy.buildContext(session, userTurn.content, options);
  const messages = await strategy.buildMessages(session, [...history, userTurn], context);
  const result = await chatEngine.complete(messages, { model: strategy.model });
  const processed = await strategy.postProcess(result, context);

  const userMessage = await AiMessage.create({
    sessionId,
    role: "user",
    content: encrypt(userTurn.content)
  });

  const assistantMessage = await AiMessage.create({
    sessionId,
    role: "assistant",
    content: encrypt(processed.content),
    citations: processed.citations || [],
    tokenUsage: {
      promptTokens: result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
      totalTokens: result.usage.totalTokens
    },
    metadata: processed.metadata || {}
  });

  await usageService.record({
    userId: lawyerId,
    sessionId,
    messageId: assistantMessage._id,
    type: AI_USAGE_TYPES.CHAT_COMPLETION,
    mode: session.mode,
    model: result.model,
    promptTokens: result.usage.promptTokens,
    completionTokens: result.usage.completionTokens,
    totalTokens: result.usage.totalTokens,
    metadata: {
      source: "chat_message",
      workspaceId: workspaceId ? String(workspaceId) : String(session.workspaceId || "")
    }
  });

  await sessionService.updateSessionTitle(session, userTurn.content);
  session.updatedAt = new Date();
  await session.save();

  return {
    userMessage: formatMessage(userMessage),
    assistantMessage: formatMessage(assistantMessage)
  };
}
