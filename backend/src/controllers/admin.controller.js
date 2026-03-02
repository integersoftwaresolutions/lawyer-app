import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../helpers/response.helper.js";
import * as adminService from "../services/admin.service.js";

export const pendingLawyers = asyncHandler(async (_req, res) => {
  const out = await adminService.listPendingLawyers();
  return sendSuccess(res, { message: "Pending lawyers", data: out });
});

export const allLawyers = asyncHandler(async (req, res) => {
  const out = await adminService.listAllLawyers(req.query);
  return sendSuccess(res, { message: "All lawyers", data: out.items, meta: out.meta });
});

export const verifyLawyer = asyncHandler(async (req, res) => {
  const out = await adminService.setLawyerVerification({
    lawyerUserId: req.params.lawyerUserId,
    status: req.body.status,
    notes: req.body.notes,
    adminId: req.user.id
  });
  return sendSuccess(res, { message: "Updated verification", data: out });
});

export const getSettings = asyncHandler(async (_req, res) => {
  const out = await adminService.getSettings();
  return sendSuccess(res, { message: "Settings", data: out });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const out = await adminService.updateSettings(req.body);
  return sendSuccess(res, { message: "Settings updated", data: out });
});

export const getAnalytics = asyncHandler(async (_req, res) => {
  const out = await adminService.getAnalytics();
  return sendSuccess(res, { message: "Analytics", data: out });
});

export const getAllUsers = asyncHandler(async (req, res) => {
  const out = await adminService.getAllUsers(req.query);
  return sendSuccess(res, { message: "Users", data: out.items, meta: out.meta });
});

export const getAllBookings = asyncHandler(async (req, res) => {
  const out = await adminService.getAllBookings(req.query);
  return sendSuccess(res, { message: "Bookings", data: out.items, meta: out.meta });
});

export const getVerificationDocs = asyncHandler(async (req, res) => {
  const out = await adminService.getVerificationDocuments(req.params.lawyerUserId);
  return sendSuccess(res, { message: "Verification documents", data: out });
});

export const reviewDocument = asyncHandler(async (req, res) => {
  const out = await adminService.reviewVerificationDocument({
    documentId: req.params.documentId,
    status: req.body.status,
    notes: req.body.notes,
    adminId: req.user.id
  });
  return sendSuccess(res, { message: "Document reviewed", data: out });
});
