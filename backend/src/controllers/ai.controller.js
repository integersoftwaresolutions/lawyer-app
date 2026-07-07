import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../helpers/response.helper.js";
import * as aiService from "../services/ai/ai.service.js";
import * as sessionService from "../services/ai/session.service.js";
import * as messageService from "../services/ai/message.service.js";
import * as reportService from "../services/ai/report.service.js";
import { isOpenAiConfigured } from "../services/ai/openai.client.js";
import { aiConfig } from "../config/ai.config.js";
import { isPineconeConfigured } from "../config/rag.config.js";
import { isEncryptionConfigured } from "../services/ai/encryption.util.js";

export const health = asyncHandler(async (req, res) => {
  const data = await aiService.healthCheck(req.user.id);
  return sendSuccess(res, { message: "AI service is healthy", data });
});

export const config = asyncHandler(async (req, res) => {
  return sendSuccess(res, {
    message: "AI configuration",
    data: {
      openaiConfigured: isOpenAiConfigured(),
      chatModel: aiConfig.chatModel,
      embeddingModel: aiConfig.embeddingModel,
      encryptionConfigured: isEncryptionConfigured(),
      ragEnabled: isPineconeConfigured()
    }
  });
});

export const usageSummary = asyncHandler(async (req, res) => {
  const period = req.validated?.query?.period || req.query.period || "month";
  const data = await aiService.getUsageSummary(req.user.id, period);
  return sendSuccess(res, { message: "AI usage summary", data });
});

export const createSession = asyncHandler(async (req, res) => {
  const { mode, title, caseRef, metadata } = req.body;
  const data = await sessionService.createSession({
    lawyerId: req.user.id,
    mode,
    title,
    caseRef,
    metadata
  });
  return sendSuccess(res, { statusCode: 201, message: "Session created", data });
});

export const listSessions = asyncHandler(async (req, res) => {
  const out = await sessionService.listSessions(req.user.id, req.query);
  return sendSuccess(res, { message: "Sessions", data: out.items, meta: out.meta });
});

export const getSession = asyncHandler(async (req, res) => {
  const session = await sessionService.getOwnedSession(req.params.sessionId, req.user.id);
  const messages = await messageService.listMessages(req.params.sessionId);
  return sendSuccess(res, {
    message: "Session",
    data: {
      session: {
        id: session._id,
        lawyerId: session.lawyerId,
        title: session.title,
        mode: session.mode,
        caseRef: session.caseRef,
        metadata: session.metadata,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      },
      messages
    }
  });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const data = await messageService.sendMessage({
    sessionId: req.params.sessionId,
    lawyerId: req.user.id,
    content: req.body.content,
    options: req.body.options
  });
  return sendSuccess(res, { message: "Message sent", data });
});

export const deleteSession = asyncHandler(async (req, res) => {
  const data = await sessionService.deleteSession(req.params.sessionId, req.user.id);
  return sendSuccess(res, { message: "Session deleted", data });
});

export const updateSession = asyncHandler(async (req, res) => {
  const data = await sessionService.updateSessionMetadata(
    req.params.sessionId,
    req.user.id,
    req.body
  );
  return sendSuccess(res, { message: "Session updated", data });
});

export const generatePrepReport = asyncHandler(async (req, res) => {
  const session = await sessionService.getOwnedSession(req.params.sessionId, req.user.id);
  const data = await reportService.generateReportData({ session, lawyerId: req.user.id });
  return sendSuccess(res, { message: "Prep report generated", data });
});

export const downloadPrepReport = asyncHandler(async (req, res) => {
  const session = await sessionService.getOwnedSession(req.params.sessionId, req.user.id);
  const data = await reportService.generateReportData({ session, lawyerId: req.user.id });
  const buffer = await reportService.renderReportPdf(data);

  const safeTitle = (session.title || "cross-exam")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "cross-exam";
  const filename = `prep-report-${safeTitle}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Length", buffer.length);
  return res.end(buffer);
});
