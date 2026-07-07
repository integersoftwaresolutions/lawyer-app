import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../helpers/response.helper.js";
import { ApiError } from "../helpers/apiError.js";
import * as ragService from "../services/ai/rag.service.js";

// ---------------------------------------------------------------------------
// Admin — case law corpus
// ---------------------------------------------------------------------------

export const adminListCaseLaw = asyncHandler(async (req, res) => {
  const out = await ragService.listCaseLaw(req.query);
  return sendSuccess(res, { message: "Case law", data: out.items, meta: out.meta });
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
// Lawyer — private documents
// ---------------------------------------------------------------------------

export const lawyerListDocuments = asyncHandler(async (req, res) => {
  const out = await ragService.listLegalDocuments(req.user.id, req.query);
  return sendSuccess(res, { message: "Documents", data: out.items, meta: out.meta });
});

export const lawyerGetDocument = asyncHandler(async (req, res) => {
  const out = await ragService.getLegalDocument(req.user.id, req.params.documentId);
  return sendSuccess(res, { message: "Document", data: out });
});

export const lawyerIngestDocument = asyncHandler(async (req, res) => {
  if (!req.file && !req.body?.text) {
    throw new ApiError(400, "Provide a `text` field or upload a file");
  }
  let out;
  if (req.file) {
    out = await ragService.ingestLegalDocumentFromFile({
      ownerUserId: req.user.id,
      file: req.file,
      body: req.body,
      options: { userId: req.user.id }
    });
  } else {
    out = await ragService.ingestLegalDocumentFromText({
      ownerUserId: req.user.id,
      body: req.body,
      options: { userId: req.user.id }
    });
  }
  return sendSuccess(res, { statusCode: 201, message: "Document ingested", data: out });
});

export const lawyerDeleteDocument = asyncHandler(async (req, res) => {
  const out = await ragService.deleteLegalDocument(req.user.id, req.params.documentId);
  return sendSuccess(res, { message: "Document deleted", data: out });
});
