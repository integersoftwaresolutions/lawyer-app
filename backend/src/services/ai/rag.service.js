import { ApiError } from "../../helpers/apiError.js";
import { RAG_INGESTION_STATUS } from "../../config/constants.js";
import CaseLaw from "../../models/CaseLaw.js";
import LegalDocument from "../../models/LegalDocument.js";
import { getPagination, buildPaginationMeta } from "../../utils/pagination.js";
import { extractText } from "./ingest/textExtractor.js";
import * as ingestService from "./ingest/ingest.service.js";

// ---------------------------------------------------------------------------
// Case law (admin-managed, shared corpus)
// ---------------------------------------------------------------------------

export async function ingestCaseLawFromText(input, options = {}) {
  return ingestService.ingestCaseLaw(input, options);
}

export async function ingestCaseLawFromFile(file, body, options = {}) {
  if (!file?.buffer) throw new ApiError(400, "File is required");
  const text = await extractText({
    buffer: file.buffer,
    mimeType: file.mimetype,
    fileName: file.originalname
  });
  if (!text || text.trim().length < 50) {
    throw new ApiError(400, "Could not extract usable text from the uploaded file");
  }
  return ingestService.ingestCaseLaw({ ...body, text }, options);
}

export async function listCaseLaw(query = {}) {
  const { page, limit, skip } = getPagination(query);
  const filter = { isDeleted: false };

  if (query.court) filter.court = query.court;
  if (query.status) filter.status = query.status;
  if (query.yearFrom || query.yearTo) {
    filter.year = {};
    if (query.yearFrom) filter.year.$gte = Number(query.yearFrom);
    if (query.yearTo) filter.year.$lte = Number(query.yearTo);
  }
  if (query.q) {
    const re = new RegExp(escapeRegExp(query.q), "i");
    filter.$or = [{ title: re }, { caseReference: re }, { citation: re }, { subject: re }];
  }

  const [total, items] = await Promise.all([
    CaseLaw.countDocuments(filter),
    CaseLaw.find(filter)
      .select("-rawText")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
  ]);

  return { items: items.map(formatCaseLaw), meta: buildPaginationMeta(total, { page, limit }) };
}

export async function getCaseLaw(caseLawId) {
  const row = await CaseLaw.findOne({ _id: caseLawId, isDeleted: false }).lean();
  if (!row) throw new ApiError(404, "Case-law not found");
  return formatCaseLaw(row, { includeText: true });
}

export async function deleteCaseLaw(caseLawId) {
  return ingestService.deleteCaseLaw(caseLawId);
}

// ---------------------------------------------------------------------------
// Lawyer documents (private, per-lawyer namespace)
// ---------------------------------------------------------------------------

export async function ingestLegalDocumentFromText({ ownerUserId, body, options = {} }) {
  if (!body.text) throw new ApiError(400, "text is required when no file is uploaded");
  return ingestService.ingestLegalDocument(
    {
      ownerUserId,
      title: body.title,
      description: body.description,
      caseRef: body.caseRef,
      tags: body.tags,
      text: body.text
    },
    options
  );
}

export async function ingestLegalDocumentFromFile({ ownerUserId, file, body, options = {} }) {
  if (!file?.buffer) throw new ApiError(400, "File is required");
  return ingestService.ingestLegalDocument(
    {
      ownerUserId,
      title: body.title || file.originalname,
      description: body.description,
      caseRef: body.caseRef,
      tags: body.tags,
      buffer: file.buffer,
      mimeType: file.mimetype,
      fileName: file.originalname
    },
    options
  );
}

export async function listLegalDocuments(ownerUserId, query = {}) {
  const { page, limit, skip } = getPagination(query);
  const filter = { ownerUserId, isDeleted: false };

  if (query.caseRef) filter.caseRef = query.caseRef;
  if (query.status) filter.status = query.status;
  if (query.q) {
    const re = new RegExp(escapeRegExp(query.q), "i");
    filter.$or = [{ title: re }, { description: re }, { caseRef: re }];
  }

  const [total, items] = await Promise.all([
    LegalDocument.countDocuments(filter),
    LegalDocument.find(filter)
      .select("-rawText")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
  ]);

  return { items: items.map(formatLegalDocument), meta: buildPaginationMeta(total, { page, limit }) };
}

export async function getLegalDocument(ownerUserId, documentId) {
  const row = await LegalDocument.findOne({ _id: documentId, ownerUserId, isDeleted: false }).lean();
  if (!row) throw new ApiError(404, "Document not found");
  return formatLegalDocument(row, { includeText: true });
}

export async function deleteLegalDocument(ownerUserId, documentId) {
  return ingestService.deleteLegalDocument(documentId, ownerUserId);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatCaseLaw(row, { includeText = false } = {}) {
  return {
    id: row._id,
    title: row.title,
    court: row.court,
    year: row.year,
    caseReference: row.caseReference,
    citation: row.citation,
    subject: row.subject,
    judges: row.judges,
    decisionDate: row.decisionDate,
    sourceUrl: row.sourceUrl,
    sourceProvider: row.sourceProvider,
    chunkCount: row.chunkCount,
    embeddingModel: row.embeddingModel,
    rawTextChars: row.rawTextChars,
    status: row.status,
    statusMessage: row.statusMessage,
    indexedAt: row.indexedAt,
    isPublic: row.isPublic,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    ...(includeText ? { rawText: row.rawText } : {})
  };
}

function formatLegalDocument(row, { includeText = false } = {}) {
  return {
    id: row._id,
    ownerUserId: row.ownerUserId,
    title: row.title,
    description: row.description,
    caseRef: row.caseRef,
    tags: row.tags,
    mediaId: row.mediaId,
    chunkCount: row.chunkCount,
    embeddingModel: row.embeddingModel,
    rawTextChars: row.rawTextChars,
    status: row.status,
    statusMessage: row.statusMessage,
    indexedAt: row.indexedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    ...(includeText ? { rawText: row.rawText } : {})
  };
}

export const STATUS = RAG_INGESTION_STATUS;
