import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess, sendListSuccess } from "../helpers/response.helper.js";
import { ApiError } from "../helpers/apiError.js";
import * as ragService from "../services/ai/rag.service.js";
import { PERMISSIONS } from "../workspaces/permissions.catalog.js";
import { hasPermission } from "../workspaces/permissions.catalog.js";

function docCtx(req) {
  return {
    workspaceId: req.workspace._id,
    userId: req.user.id,
    isOwner: Boolean(req.membership?.isOwner),
    permissions: req.permissions || []
  };
}

// ---------------------------------------------------------------------------
// Admin — case law corpus
// ---------------------------------------------------------------------------

export const adminListCaseLaw = asyncHandler(async (req, res) => {
  const out = await ragService.listCaseLaw(req.query);
  return sendListSuccess(res, { message: "Case law", ...out });
});

export const adminGetCaseLaw = asyncHandler(async (req, res) => {
  const out = await ragService.getCaseLaw(req.params.caseLawId);
  return sendSuccess(res, { message: "Case law", data: out });
});

export const adminIngestCaseLaw = asyncHandler(async (req, res) => {
  if (!req.file && !req.body?.text) {
    throw new ApiError(400, "Provide a `text` field or upload a file");
  }
  let out;
  if (req.file) {
    out = await ragService.ingestCaseLawFromFile(req.file, req.body, { userId: req.user.id });
  } else {
    out = await ragService.ingestCaseLawFromText(req.body, { userId: req.user.id });
  }
  return sendSuccess(res, { statusCode: 201, message: "Case law ingested", data: out });
});

export const adminDeleteCaseLaw = asyncHandler(async (req, res) => {
  const out = await ragService.deleteCaseLaw(req.params.caseLawId);
  return sendSuccess(res, { message: "Case law deleted", data: out });
});

// ---------------------------------------------------------------------------
// Lawyer — workspace documents
// ---------------------------------------------------------------------------

export const lawyerListDocuments = asyncHandler(async (req, res) => {
  const out = await ragService.listLegalDocuments(docCtx(req), req.query);
  return sendListSuccess(res, { message: "Documents", ...out });
});

export const lawyerGetDocument = asyncHandler(async (req, res) => {
  const out = await ragService.getLegalDocument(docCtx(req), req.params.documentId);
  return sendSuccess(res, { message: "Document", data: out });
});

export const lawyerIngestDocument = asyncHandler(async (req, res) => {
  if (!hasPermission(req.permissions, PERMISSIONS.DOCS_UPLOAD) && !req.membership?.isOwner) {
    throw new ApiError(403, "Missing permission: docs.upload");
  }
  if (!req.file && !req.body?.text) {
    throw new ApiError(400, "Provide a `text` field or upload a file");
  }
  let out;
  if (req.file) {
    out = await ragService.ingestLegalDocumentFromFile({
      workspaceId: req.workspace._id,
      uploadedByUserId: req.user.id,
      file: req.file,
      body: req.body,
      options: { userId: req.user.id },
      ctx: docCtx(req)
    });
  } else {
    out = await ragService.ingestLegalDocumentFromText({
      workspaceId: req.workspace._id,
      uploadedByUserId: req.user.id,
      body: req.body,
      options: { userId: req.user.id },
      ctx: docCtx(req)
    });
  }
  return sendSuccess(res, { statusCode: 201, message: "Document ingested", data: out });
});

export const lawyerDeleteDocument = asyncHandler(async (req, res) => {
  const out = await ragService.deleteLegalDocument(docCtx(req), req.params.documentId);
  return sendSuccess(res, { message: "Document deleted", data: out });
});

export const lawyerUpdateDocumentVisibility = asyncHandler(async (req, res) => {
  const out = await ragService.updateDocumentVisibility(
    docCtx(req),
    req.params.documentId,
    req.body.visibility
  );
  return sendSuccess(res, { message: "Visibility updated", data: out });
});
