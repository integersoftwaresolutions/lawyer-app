import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../helpers/response.helper.js";
import * as adminService from "../services/admin.service.js";
import * as verificationService from "../services/verification.service.js";
import * as disputeService from "../services/dispute.service.js";

export const pendingLawyers = asyncHandler(async (req, res) => {
  const out = await verificationService.getPendingVerifications(req.query);
  return sendSuccess(res, { message: "Pending verifications", data: out.items, meta: out.meta });
});

export const allLawyers = asyncHandler(async (req, res) => {
  const out = await adminService.listAllLawyers(req.query);
  return sendSuccess(res, { message: "All lawyers", data: out.items, meta: out.meta });
});

export const verifyLawyer = asyncHandler(async (req, res) => {
  const out = await verificationService.verifyLawyer({
    lawyerUserId: req.params.lawyerUserId,
    status: req.body.status,
    notes: req.body.notes,
    adminId: req.user.id
  });
  return sendSuccess(res, { message: "Verification updated successfully", data: out });
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
  const out = await verificationService.getLawyerDocuments(req.params.lawyerUserId);
  return sendSuccess(res, { message: "Verification documents", data: out });
});

export const reviewDocument = asyncHandler(async (req, res) => {
  const out = await verificationService.reviewDocument({
    documentId: req.params.documentId,
    status: req.body.status,
    notes: req.body.notes,
    adminId: req.user.id
  });
  return sendSuccess(res, { message: "Document reviewed successfully", data: out });
});

export const getLawyerVerificationStatus = asyncHandler(async (req, res) => {
  const out = await verificationService.getVerificationStatus(req.params.lawyerUserId);
  return sendSuccess(res, { message: "Verification status", data: out });
});

export const getDisputes = asyncHandler(async (req, res) => {
  const out = await disputeService.getDisputesAdmin(req.query);
  return sendSuccess(res, { message: "Disputes", data: out.items, meta: out.meta });
});

export const getDisputeById = asyncHandler(async (req, res) => {
  const out = await disputeService.getDisputeById(req.params.disputeId);
  return sendSuccess(res, { message: "Dispute", data: out });
});

export const updateDisputeStatus = asyncHandler(async (req, res) => {
  const out = await disputeService.updateDisputeStatus({
    disputeId: req.params.disputeId,
    status: req.body.status
  });
  return sendSuccess(res, { message: "Status updated", data: out });
});

export const resolveDispute = asyncHandler(async (req, res) => {
  const out = await disputeService.resolveDispute({
    disputeId: req.params.disputeId,
    adminId: req.user.id,
    resolution: req.body.resolution,
    resolutionNote: req.body.resolutionNote,
    refundAmount: req.body.refundAmount
  });
  return sendSuccess(res, { message: "Dispute resolved", data: out });
});
