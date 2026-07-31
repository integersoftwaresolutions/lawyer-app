import Joi from "joi";
import { PAKISTANI_COURTS, RAG_INGESTION_STATUS, DOCUMENT_VISIBILITY } from "../config/constants.js";

export const ingestCaseLawSchema = Joi.object({
  body: Joi.object({
    title: Joi.string().trim().min(2).max(500).required(),
    court: Joi.string()
      .valid(...PAKISTANI_COURTS)
      .required(),
    year: Joi.number().integer().min(1900).max(2100).required(),
    caseReference: Joi.string().trim().max(200).allow("").optional(),
    citation: Joi.string().trim().max(300).allow("").optional(),
    subject: Joi.string().trim().max(200).allow("").optional(),
    judges: Joi.array().items(Joi.string().trim().max(200)).max(20).optional(),
    decisionDate: Joi.date().optional(),
    sourceUrl: Joi.string().uri().allow("").max(1000).optional(),
    sourceProvider: Joi.string().trim().max(100).allow("").optional(),
    // `text` is optional — when an attachment is uploaded the controller
    // extracts text from the file. Either text or a file must be present;
    // that's enforced in the controller.
    text: Joi.string().min(50).max(2_000_000).optional()
  }).required()
});

export const listCaseLawSchema = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(50).optional(),
    court: Joi.string()
      .valid(...PAKISTANI_COURTS)
      .optional(),
    yearFrom: Joi.number().integer().min(1900).max(2100).optional(),
    yearTo: Joi.number().integer().min(1900).max(2100).optional(),
    status: Joi.string()
      .valid(...Object.values(RAG_INGESTION_STATUS))
      .optional(),
    q: Joi.string().trim().max(200).optional()
  }).required()
});

export const caseLawIdParamSchema = Joi.object({
  params: Joi.object({
    caseLawId: Joi.string().hex().length(24).required()
  }).required()
});

export const ingestLegalDocumentSchema = Joi.object({
  body: Joi.object({
    title: Joi.string().trim().min(2).max(300).required(),
    description: Joi.string().trim().max(2000).allow("").optional(),
    caseRef: Joi.string().trim().max(200).allow("").optional(),
    tags: Joi.array().items(Joi.string().trim().max(50)).max(20).optional(),
    visibility: Joi.string()
      .valid(...Object.values(DOCUMENT_VISIBILITY))
      .optional(),
    caseId: Joi.string().hex().length(24).allow(null, "").optional(),
    text: Joi.string().min(20).max(2_000_000).optional()
  }).required()
});

export const listLegalDocumentsSchema = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(50).optional(),
    caseRef: Joi.string().trim().max(200).optional(),
    caseId: Joi.string().hex().length(24).optional(),
    unlinked: Joi.alternatives().try(Joi.boolean(), Joi.string()).optional(),
    visibility: Joi.string()
      .valid(...Object.values(DOCUMENT_VISIBILITY))
      .optional(),
    status: Joi.string()
      .valid(...Object.values(RAG_INGESTION_STATUS))
      .optional(),
    q: Joi.string().trim().max(200).optional()
  }).required()
});

export const legalDocumentIdParamSchema = Joi.object({
  params: Joi.object({
    documentId: Joi.string().hex().length(24).required()
  }).required()
});
