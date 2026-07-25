import { ApiError } from "../../helpers/apiError.js";
import { DOCUMENT_VISIBILITY, RAG_INGESTION_STATUS, WORKSPACE_AUDIT_ACTIONS } from "../../config/constants.js";
import CaseLaw from "../../models/CaseLaw.js";
import LegalDocument from "../../models/LegalDocument.js";
import { listResult } from "../../utils/pagination.js";
import { parseListQuery } from "../../utils/listQuery.js";
import { extractText } from "./ingest/textExtractor.js";
import * as ingestService from "./ingest/ingest.service.js";
import { writeAudit } from "../workspace.service.js";
import { PERMISSIONS, hasPermission } from "../../workspaces/permissions.catalog.js";

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
  const { filter, sort, pagination } = parseListQuery(query, {
    baseFilter: { isDeleted: false },
    filters: [
      { key: "court", path: "court", type: "eq" },
      { key: "status", path: "status", type: "eq" },
      { key: "yearFrom", path: "year", type: "gte" },
      { key: "yearTo", path: "year", type: "lte" },
      { key: "q", paths: ["title", "caseReference", "citation", "subject"], type: "regex" }
    ],
    sort: { default: { updatedAt: -1 } }
  });

  const [total, items] = await Promise.all([
    CaseLaw.countDocuments(filter),
    CaseLaw.find(filter)
      .select("-rawText")
      .sort(sort)
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean()
  ]);

  return listResult({ items: items.map(formatCaseLaw), total, pagination });
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
// Workspace documents
// ---------------------------------------------------------------------------

function canViewDocument(doc, { userId, isOwner, permissions }) {
  if (!hasPermission(permissions, PERMISSIONS.DOCS_VIEW) && !isOwner) return false;
  if (doc.visibility === DOCUMENT_VISIBILITY.PRIVATE) {
    return isOwner || String(doc.uploadedByUserId) === String(userId);
  }
  return true;
}

function documentListFilter(workspaceId, { userId, isOwner }) {
  const base = { workspaceId, isDeleted: false };
  if (isOwner) return base;
  return {
    ...base,
    $or: [
      { visibility: { $in: [DOCUMENT_VISIBILITY.FIRM, DOCUMENT_VISIBILITY.PUBLIC] } },
      { visibility: DOCUMENT_VISIBILITY.PRIVATE, uploadedByUserId: userId }
    ]
  };
}

export async function ingestLegalDocumentFromText({
  workspaceId,
  uploadedByUserId,
  body,
  options = {}
}) {
  if (!body.text) throw new ApiError(400, "text is required when no file is uploaded");
  return ingestService.ingestLegalDocument(
    {
      workspaceId,
      uploadedByUserId,
      visibility: body.visibility || DOCUMENT_VISIBILITY.PRIVATE,
      title: body.title,
      description: body.description,
      caseRef: body.caseRef,
      tags: body.tags,
      text: body.text
    },
    options
  );
}

export async function ingestLegalDocumentFromFile({
  workspaceId,
  uploadedByUserId,
  file,
  body,
  options = {}
}) {
  if (!file?.buffer) throw new ApiError(400, "File is required");
  return ingestService.ingestLegalDocument(
    {
      workspaceId,
      uploadedByUserId,
      visibility: body.visibility || DOCUMENT_VISIBILITY.PRIVATE,
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

export async function listLegalDocuments(ctx, query = {}) {
  const { workspaceId, userId, isOwner, permissions } = ctx;
  if (!hasPermission(permissions, PERMISSIONS.DOCS_VIEW) && !isOwner) {
    throw new ApiError(403, "Missing permission: docs.view");
  }

  const { filter, sort, pagination } = parseListQuery(query, {
    baseFilter: documentListFilter(workspaceId, { userId, isOwner }),
    filters: [
      { key: "caseRef", path: "caseRef", type: "eq" },
      { key: "status", path: "status", type: "eq" },
      { key: "visibility", path: "visibility", type: "eq" }
    ],
    sort: { default: { updatedAt: -1 } }
  });

  // Keep q as $and so it does not overwrite visibility $or from baseFilter
  if (query.q) {
    const re = new RegExp(escapeRegExp(query.q), "i");
    filter.$and = [
      ...(filter.$and || []),
      { $or: [{ title: re }, { description: re }, { caseRef: re }] }
    ];
  }

  const [total, items] = await Promise.all([
    LegalDocument.countDocuments(filter),
    LegalDocument.find(filter)
      .select("-rawText")
      .sort(sort)
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean()
  ]);

  return listResult({ items: items.map(formatLegalDocument), total, pagination });
}

export async function getLegalDocument(ctx, documentId) {
  const { workspaceId, userId, isOwner, permissions } = ctx;
  const row = await LegalDocument.findOne({
    _id: documentId,
    workspaceId,
    isDeleted: false
  }).lean();
  if (!row) throw new ApiError(404, "Document not found");
  if (!canViewDocument(row, { userId, isOwner, permissions })) {
    throw new ApiError(403, "You cannot view this document");
  }
  return formatLegalDocument(row, { includeText: true });
}

export async function deleteLegalDocument(ctx, documentId) {
  const { workspaceId, userId, isOwner, permissions } = ctx;
  const row = await LegalDocument.findOne({
    _id: documentId,
    workspaceId,
    isDeleted: false
  }).lean();
  if (!row) throw new ApiError(404, "Document not found");

  const canDelete =
    isOwner ||
    (hasPermission(permissions, PERMISSIONS.DOCS_DELETE) &&
      (row.visibility !== DOCUMENT_VISIBILITY.PRIVATE ||
        String(row.uploadedByUserId) === String(userId)));

  if (!canDelete) throw new ApiError(403, "Missing permission to delete this document");

  return ingestService.deleteLegalDocument(documentId, { workspaceId });
}

export async function updateDocumentVisibility(ctx, documentId, visibility) {
  const { workspaceId, userId, isOwner, permissions } = ctx;
  if (!Object.values(DOCUMENT_VISIBILITY).includes(visibility)) {
    throw new ApiError(400, "Invalid visibility");
  }
  if (!hasPermission(permissions, PERMISSIONS.DOCS_MANAGE_VISIBILITY) && !isOwner) {
    throw new ApiError(403, "Missing permission: docs.manage_visibility");
  }

  const row = await LegalDocument.findOne({
    _id: documentId,
    workspaceId,
    isDeleted: false
  });
  if (!row) throw new ApiError(404, "Document not found");

  if (
    row.visibility === DOCUMENT_VISIBILITY.PRIVATE &&
    !isOwner &&
    String(row.uploadedByUserId) !== String(userId)
  ) {
    throw new ApiError(403, "Only the uploader or owner can change visibility of a private document");
  }

  const prev = row.visibility;
  row.visibility = visibility;
  await row.save();

  await ingestService.reindexLegalDocumentVisibility(row._id);

  await writeAudit({
    workspaceId,
    actorUserId: userId,
    action: WORKSPACE_AUDIT_ACTIONS.DOC_VISIBILITY_CHANGED,
    meta: { documentId, from: prev, to: visibility }
  });

  return formatLegalDocument(row.toObject());
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
    workspaceId: row.workspaceId,
    uploadedByUserId: row.uploadedByUserId,
    visibility: row.visibility,
    caseId: row.caseId,
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
