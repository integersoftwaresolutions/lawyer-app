import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess, sendListSuccess } from "../helpers/response.helper.js";
import * as caseService from "../services/case.service.js";

function caseCtx(req) {
  return {
    workspaceId: req.workspace._id,
    userId: req.user.id,
    isOwner: Boolean(req.membership?.isOwner),
    permissions: req.permissions || []
  };
}

export const listCases = asyncHandler(async (req, res) => {
  const out = await caseService.listCases(caseCtx(req), req.query);
  return sendListSuccess(res, { message: "Cases", ...out });
});

export const getCaseMeta = asyncHandler(async (req, res) => {
  return sendSuccess(res, { message: "Case meta", data: caseService.CASE_META });
});

export const getCase = asyncHandler(async (req, res) => {
  const out = await caseService.getCase(caseCtx(req), req.params.caseId);
  return sendSuccess(res, { message: "Case", data: out });
});

export const createCase = asyncHandler(async (req, res) => {
  const out = await caseService.createCase(caseCtx(req), req.body);
  return sendSuccess(res, { statusCode: 201, message: "Case created", data: out });
});

export const updateCase = asyncHandler(async (req, res) => {
  const out = await caseService.updateCase(caseCtx(req), req.params.caseId, req.body);
  return sendSuccess(res, { message: "Case updated", data: out });
});

export const assignCase = asyncHandler(async (req, res) => {
  const out = await caseService.assignCase(caseCtx(req), req.params.caseId, req.body);
  return sendSuccess(res, { message: "Case assigned", data: out });
});

export const changeCaseStatus = asyncHandler(async (req, res) => {
  const out = await caseService.changeCaseStatus(caseCtx(req), req.params.caseId, req.body);
  return sendSuccess(res, { message: "Case status updated", data: out });
});

export const archiveCase = asyncHandler(async (req, res) => {
  const out = await caseService.archiveCase(caseCtx(req), req.params.caseId);
  return sendSuccess(res, { message: "Case archived", data: out });
});

export const restoreCase = asyncHandler(async (req, res) => {
  const out = await caseService.restoreCase(caseCtx(req), req.params.caseId);
  return sendSuccess(res, { message: "Case restored", data: out });
});

export const deleteCase = asyncHandler(async (req, res) => {
  const out = await caseService.deleteCase(caseCtx(req), req.params.caseId);
  return sendSuccess(res, { message: "Case deleted", data: out });
});

export const addNote = asyncHandler(async (req, res) => {
  const out = await caseService.addNote(caseCtx(req), req.params.caseId, req.body);
  return sendSuccess(res, { statusCode: 201, message: "Note added", data: out });
});

export const updateNote = asyncHandler(async (req, res) => {
  const out = await caseService.updateNote(
    caseCtx(req),
    req.params.caseId,
    req.params.noteId,
    req.body
  );
  return sendSuccess(res, { message: "Note updated", data: out });
});

export const deleteNote = asyncHandler(async (req, res) => {
  const out = await caseService.deleteNote(caseCtx(req), req.params.caseId, req.params.noteId);
  return sendSuccess(res, { message: "Note deleted", data: out });
});

export const listCaseDocuments = asyncHandler(async (req, res) => {
  const out = await caseService.listCaseDocuments(caseCtx(req), req.params.caseId, req.query);
  return sendListSuccess(res, { message: "Case documents", ...out });
});

export const attachDocument = asyncHandler(async (req, res) => {
  const out = await caseService.attachDocument(
    caseCtx(req),
    req.params.caseId,
    req.body.documentId
  );
  return sendSuccess(res, { message: "Document attached", data: out });
});

export const detachDocument = asyncHandler(async (req, res) => {
  const out = await caseService.detachDocument(
    caseCtx(req),
    req.params.caseId,
    req.params.documentId
  );
  return sendSuccess(res, { message: "Document detached", data: out });
});

export const linkBooking = asyncHandler(async (req, res) => {
  const out = await caseService.linkBooking(
    caseCtx(req),
    req.params.caseId,
    req.body.bookingId
  );
  return sendSuccess(res, { message: "Booking link updated", data: out });
});
