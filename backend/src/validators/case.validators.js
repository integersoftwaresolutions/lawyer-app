import Joi from "joi";
import {
  CASE_LIST_SCOPES,
  CASE_PRIORITY,
  CASE_STATUS,
  CASE_TYPES,
  CASE_VISIBILITY,
  PAKISTANI_COURTS
} from "../config/constants.js";

const objectId = Joi.string().hex().length(24);
const partySchema = Joi.object({
  name: Joi.string().trim().max(300).allow("").optional(),
  contact: Joi.string().trim().max(300).allow("").optional(),
  counsel: Joi.string().trim().max(300).allow("").optional()
}).optional();

export const listCasesSchema = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(50).optional(),
    scope: Joi.string()
      .valid(...Object.values(CASE_LIST_SCOPES))
      .optional(),
    includeArchived: Joi.alternatives().try(Joi.boolean(), Joi.string()).optional(),
    status: Joi.string()
      .valid(...Object.values(CASE_STATUS))
      .optional(),
    priority: Joi.string()
      .valid(...Object.values(CASE_PRIORITY))
      .optional(),
    type: Joi.string()
      .valid(...Object.values(CASE_TYPES))
      .optional(),
    primaryLawyerUserId: objectId.optional(),
    tags: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    openedFrom: Joi.date().optional(),
    openedTo: Joi.date().optional(),
    nextHearingFrom: Joi.date().optional(),
    nextHearingTo: Joi.date().optional(),
    q: Joi.string().trim().max(200).allow("").optional()
  }).required()
});

export const caseIdParamSchema = Joi.object({
  params: Joi.object({
    caseId: objectId.required()
  }).required()
});

export const createCaseSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().min(2).max(300).required(),
    type: Joi.string()
      .valid(...Object.values(CASE_TYPES))
      .required(),
    typeCustom: Joi.string().trim().max(120).allow("").optional(),
    status: Joi.string()
      .valid(...Object.values(CASE_STATUS))
      .optional(),
    priority: Joi.string()
      .valid(...Object.values(CASE_PRIORITY))
      .required(),
    summary: Joi.string().trim().max(1000).allow("").optional(),
    description: Joi.string().trim().max(20000).allow("").optional(),
    tags: Joi.array().items(Joi.string().trim().max(50)).max(30).optional(),
    customLabels: Joi.array().items(Joi.string().trim().max(50)).max(20).optional(),
    openedAt: Joi.date().optional(),
    nextHearingAt: Joi.date().allow(null).optional(),
    filingAt: Joi.date().allow(null).optional(),
    court: Joi.string()
      .valid(...PAKISTANI_COURTS, "")
      .optional(),
    jurisdictionCity: Joi.string().trim().max(120).allow("").optional(),
    caseNumber: Joi.string().trim().max(120).allow("").optional(),
    parties: Joi.object({
      client: partySchema,
      opponent: partySchema,
      court: partySchema,
      counsel: partySchema
    }).optional(),
    primaryLawyerUserId: objectId.optional(),
    collaboratorUserIds: Joi.array().items(objectId).max(50).optional(),
    visibility: Joi.string()
      .valid(...Object.values(CASE_VISIBILITY))
      .optional(),
    restrictedMemberIds: Joi.array().items(objectId).max(50).optional(),
    bookingId: objectId.allow(null).optional()
  }).required()
});

export const updateCaseSchema = Joi.object({
  params: Joi.object({ caseId: objectId.required() }).required(),
  body: Joi.object({
    name: Joi.string().trim().min(2).max(300).optional(),
    type: Joi.string()
      .valid(...Object.values(CASE_TYPES))
      .optional(),
    typeCustom: Joi.string().trim().max(120).allow("").optional(),
    priority: Joi.string()
      .valid(...Object.values(CASE_PRIORITY))
      .optional(),
    summary: Joi.string().trim().max(1000).allow("").optional(),
    description: Joi.string().trim().max(20000).allow("").optional(),
    tags: Joi.array().items(Joi.string().trim().max(50)).max(30).optional(),
    customLabels: Joi.array().items(Joi.string().trim().max(50)).max(20).optional(),
    openedAt: Joi.date().allow(null).optional(),
    nextHearingAt: Joi.date().allow(null).optional(),
    filingAt: Joi.date().allow(null).optional(),
    closedAt: Joi.date().allow(null).optional(),
    court: Joi.string()
      .valid(...PAKISTANI_COURTS, "")
      .optional(),
    jurisdictionCity: Joi.string().trim().max(120).allow("").optional(),
    caseNumber: Joi.string().trim().max(120).allow("").optional(),
    parties: Joi.object({
      client: partySchema,
      opponent: partySchema,
      court: partySchema,
      counsel: partySchema
    }).optional(),
    visibility: Joi.string()
      .valid(...Object.values(CASE_VISIBILITY))
      .optional(),
    restrictedMemberIds: Joi.array().items(objectId).max(50).optional()
  })
    .min(1)
    .required()
});

export const assignCaseSchema = Joi.object({
  params: Joi.object({ caseId: objectId.required() }).required(),
  body: Joi.object({
    primaryLawyerUserId: objectId.required(),
    collaboratorUserIds: Joi.array().items(objectId).max(50).optional()
  }).required()
});

export const statusCaseSchema = Joi.object({
  params: Joi.object({ caseId: objectId.required() }).required(),
  body: Joi.object({
    status: Joi.string()
      .valid(...Object.values(CASE_STATUS))
      .required()
  }).required()
});

export const noteBodySchema = Joi.object({
  params: Joi.object({ caseId: objectId.required() }).required(),
  body: Joi.object({
    body: Joi.string().trim().min(1).max(10000).required()
  }).required()
});

export const noteIdParamSchema = Joi.object({
  params: Joi.object({
    caseId: objectId.required(),
    noteId: objectId.required()
  }).required()
});

export const updateNoteSchema = Joi.object({
  params: Joi.object({
    caseId: objectId.required(),
    noteId: objectId.required()
  }).required(),
  body: Joi.object({
    body: Joi.string().trim().min(1).max(10000).required()
  }).required()
});

export const attachDocumentSchema = Joi.object({
  params: Joi.object({ caseId: objectId.required() }).required(),
  body: Joi.object({
    documentId: objectId.required()
  }).required()
});

export const detachDocumentSchema = Joi.object({
  params: Joi.object({
    caseId: objectId.required(),
    documentId: objectId.required()
  }).required()
});

export const linkBookingSchema = Joi.object({
  params: Joi.object({ caseId: objectId.required() }).required(),
  body: Joi.object({
    bookingId: objectId.allow(null).required()
  }).required()
});

export const listCaseDocumentsSchema = Joi.object({
  params: Joi.object({ caseId: objectId.required() }).required(),
  query: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(50).optional()
  }).required()
});
