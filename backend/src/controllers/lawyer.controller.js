import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess, sendListSuccess } from "../helpers/response.helper.js";
import { ApiError } from "../helpers/apiError.js";
import * as lawyerService from "../services/lawyer.service.js";
import * as disputeService from "../services/dispute.service.js";
import * as availabilityService from "../services/availability.service.js";
import * as reviewService from "../services/review.service.js";
import * as bookingService from "../services/booking.service.js";
import * as verificationService from "../services/verification.service.js";
import * as profileBoostService from "../services/profileBoost.service.js";
import { listResultFromArray } from "../utils/pagination.js";

export const search = asyncHandler(async (req, res) => {
  const out = await lawyerService.searchLawyers(req.query);
  return sendListSuccess(res, { message: "Lawyers", ...out });
});

export const profile = asyncHandler(async (req, res) => {
  const out = await lawyerService.getLawyerProfile(req.params.lawyerUserId);
  return sendSuccess(res, { message: "Lawyer profile", data: out });
});

export const getContactDetails = asyncHandler(async (req, res) => {
  const out = await lawyerService.getLawyerContactDetails(req.params.lawyerUserId, req.user.id);
  return sendSuccess(res, { message: "Contact details", data: out });
});

export const getMyProfile = asyncHandler(async (req, res) => {
  const out = await lawyerService.getMyLawyerProfile(req.user.id);
  return sendSuccess(res, { message: "My profile", data: out });
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const out = await lawyerService.updateLawyerProfile(req.user.id, req.body);
  return sendSuccess(res, { message: "Profile updated", data: out });
});

export const getMyBookings = asyncHandler(async (req, res) => {
  const out = await lawyerService.getLawyerBookings(req.user.id, req.query);
  return sendListSuccess(res, { message: "Bookings", ...out });
});

export const rescheduleMyBooking = asyncHandler(async (req, res) => {
  const out = await bookingService.rescheduleBookingAsLawyer({
    bookingId: req.params.bookingId,
    lawyerUserId: req.user.id,
    startAt: req.body.startAt,
    durationMinutes: req.body.durationMinutes
  });
  return sendSuccess(res, { message: "Booking updated", data: out });
});

export const deleteMyBooking = asyncHandler(async (req, res) => {
  const out = await bookingService.deleteBookingForLawyer({
    bookingId: req.params.bookingId,
    lawyerUserId: req.user.id
  });
  return sendSuccess(res, { message: "Booking deleted", data: out });
});

export const getMyStats = asyncHandler(async (req, res) => {
  const out = await lawyerService.getLawyerStats(req.user.id);
  return sendSuccess(res, { message: "Stats", data: out });
});

export const getMyEarnings = asyncHandler(async (req, res) => {
  const out = await lawyerService.getLawyerEarnings(req.user.id, req.query);
  return sendListSuccess(res, { message: "Earnings", ...out });
});

export const getMyAvailability = asyncHandler(async (req, res) => {
  const out = await availabilityService.getAvailability(req.user.id);
  return sendSuccess(res, { message: "Availability", data: out });
});

export const updateMyAvailability = asyncHandler(async (req, res) => {
  const out = await availabilityService.updateAvailability(req.user.id, req.body);
  return sendSuccess(res, { message: "Availability updated", data: out });
});

export const getAvailableSlots = asyncHandler(async (req, res) => {
  const out = await availabilityService.getAvailableSlots(req.params.lawyerUserId, req.query.date);
  return sendListSuccess(res, {
    message: "Available slots",
    ...listResultFromArray(Array.isArray(out) ? out : [])
  });
});

export const getMyReviews = asyncHandler(async (req, res) => {
  const out = await reviewService.getReviewsByLawyer(req.user.id, req.query);
  return sendListSuccess(res, { message: "Reviews", ...out });
});

export const raiseDispute = asyncHandler(async (req, res) => {
  const out = await disputeService.raiseDispute({
    bookingId: req.params.bookingId,
    raisedById: req.user.id,
    reason: req.body.reason,
    description: req.body.description
  });
  return sendSuccess(res, { statusCode: 201, message: "Dispute raised", data: out });
});

export const getMyDisputes = asyncHandler(async (req, res) => {
  const out = await disputeService.getMyDisputes(req.user.id, req.query);
  return sendListSuccess(res, { message: "Disputes", ...out });
});

export const getLawyerReviews = asyncHandler(async (req, res) => {
  const out = await reviewService.getReviewsByLawyer(req.params.lawyerUserId, req.query);
  return sendListSuccess(res, { message: "Reviews", ...out });
});

export const uploadVerificationDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No file uploaded");
  }

  const documentType = req.body.documentType;
  if (!documentType) {
    throw new ApiError(400, "documentType is required");
  }

  const doc = await verificationService.uploadVerificationDocument({
    file: req.file,
    lawyerUserId: req.user.id,
    documentType
  });

  return sendSuccess(res, { statusCode: 201, message: "Document uploaded successfully", data: doc });
});

export const getVerificationStatus = asyncHandler(async (req, res) => {
  const out = await verificationService.getVerificationStatus(req.user.id);
  return sendSuccess(res, { message: "Verification status", data: out });
});

export const getMyProfileBoostInfo = asyncHandler(async (req, res) => {
  const out = await profileBoostService.getMyProfileBoostInfo(req.user.id);
  return sendSuccess(res, { message: "Profile boost info", data: out });
});

export const purchaseProfileBoost = asyncHandler(async (req, res) => {
  const { durationDays } = req.body;
  const out = await profileBoostService.purchaseProfileBoost({
    lawyerUserId: req.user.id,
    durationDays
  });
  return sendSuccess(res, { message: "Profile boost purchased", data: out });
});
