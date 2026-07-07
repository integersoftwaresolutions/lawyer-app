import Joi from "joi";
import { AI_MODES, CROSS_EXAM_TONES, CROSS_EXAM_TYPES } from "../config/constants.js";

const witnessSchema = Joi.object({
  name: Joi.string().trim().max(200).optional(),
  role: Joi.string().trim().max(200).optional(),
  statement: Joi.string().trim().max(5000).optional()
});

const caseBriefSchema = Joi.object({
  facts: Joi.string().trim().max(20000).optional(),
  theory: Joi.string().trim().max(10000).optional(),
  arguments: Joi.string().trim().max(20000).optional(),
  witnesses: Joi.array().items(witnessSchema).max(20).optional(),
  exhibits: Joi.string().trim().max(10000).optional(),
  weaknesses: Joi.string().trim().max(10000).optional()
});

export const createSessionSchema = Joi.object({
  body: Joi.object({
    mode: Joi.string()
      .valid(...Object.values(AI_MODES))
      .default(AI_MODES.RESEARCH),
    title: Joi.string().trim().max(200).optional(),
    caseRef: Joi.string().trim().max(200).optional().allow(""),
    metadata: Joi.object({
      caseBrief: caseBriefSchema.optional(),
      tone: Joi.string()
        .valid(...Object.values(CROSS_EXAM_TONES))
        .optional(),
      examType: Joi.string()
        .valid(...Object.values(CROSS_EXAM_TYPES))
        .optional(),
      filters: Joi.object().optional()
    })
      .unknown(true)
      .optional()
  }).required()
});

export const updateSessionMetadataSchema = Joi.object({
  params: Joi.object({
    sessionId: Joi.string().hex().length(24).required()
  }).required(),
  body: Joi.object({
    title: Joi.string().trim().max(200).optional(),
    caseRef: Joi.string().trim().max(200).allow("").optional(),
    metadata: Joi.object({
      caseBrief: caseBriefSchema.optional(),
      tone: Joi.string()
        .valid(...Object.values(CROSS_EXAM_TONES))
        .optional(),
      examType: Joi.string()
        .valid(...Object.values(CROSS_EXAM_TYPES))
        .optional(),
      filters: Joi.object().optional()
    })
      .unknown(true)
      .optional()
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
    options: Joi.object({
      filters: Joi.object({
        court: Joi.alternatives()
          .try(Joi.string().trim().max(100), Joi.array().items(Joi.string().trim().max(100)).max(10))
          .optional(),
        yearFrom: Joi.number().integer().min(1900).max(2100).optional(),
        yearTo: Joi.number().integer().min(1900).max(2100).optional(),
        subject: Joi.string().trim().max(200).optional(),
        caseRef: Joi.string().trim().max(200).optional(),
        tag: Joi.string().trim().max(100).optional()
      }).optional(),
      includeLawyerDocuments: Joi.boolean().optional(),
      tone: Joi.string()
        .valid(...Object.values(CROSS_EXAM_TONES))
        .optional(),
      examType: Joi.string()
        .valid(...Object.values(CROSS_EXAM_TYPES))
        .optional()
    }).optional()
  }).required()
});

export const usageSummarySchema = Joi.object({
  query: Joi.object({
    period: Joi.string().valid("day", "week", "month").default("month")
  }).required()
});
