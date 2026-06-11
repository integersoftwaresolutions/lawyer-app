import Joi from "joi";
import { AI_MODES } from "../config/constants.js";

export const createSessionSchema = Joi.object({
  body: Joi.object({
    mode: Joi.string()
      .valid(...Object.values(AI_MODES))
      .default(AI_MODES.RESEARCH),
    title: Joi.string().trim().max(200).optional(),
    caseRef: Joi.string().trim().max(200).optional().allow(""),
    metadata: Joi.object().optional()
  }).required()
});

export const listSessionsSchema = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(50).optional(),
    mode: Joi.string()
      .valid(...Object.values(AI_MODES))
      .optional()
  }).required()
});

export const sessionIdParamSchema = Joi.object({
  params: Joi.object({
    sessionId: Joi.string().hex().length(24).required()
  }).required()
});

export const sendMessageSchema = Joi.object({
  params: Joi.object({
    sessionId: Joi.string().hex().length(24).required()
  }).required(),
  body: Joi.object({
    content: Joi.string().trim().min(1).max(12000).required(),
    options: Joi.object().optional()
  }).required()
});

export const usageSummarySchema = Joi.object({
  query: Joi.object({
    period: Joi.string().valid("day", "week", "month").default("month")
  }).required()
});
