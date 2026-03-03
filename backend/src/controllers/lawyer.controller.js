import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../helpers/response.helper.js";
import * as lawyerService from "../services/lawyer.service.js";
import * as availabilityService from "../services/availability.service.js";
import * as reviewService from "../services/review.service.js";
import * as bookingService from "../services/booking.service.js";
import * as verificationService from "../services/verification.service.js";

export const search = asyncHandler(async (req, res) => {
  const out = await lawyerService.searchLawyers(req.query);
  return sendSuccess(res, { message: "Lawyers", data: out.items, meta: out.meta });
});

export const profile = asyncHandler(async (req, res) => {
  const out = await lawyerService.getLawyerProfile(req.params.lawyerUserId);
  return sendSuccess(res, { message: "Lawyer profile", data: out });
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
  return sendSuccess(res, { message: "Bookings", data: out.items, meta: out.meta });
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
  return sendSuccess(res, { message: "Earnings", data: out.items, meta: out.meta, summary: out.summary });
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
  return sendSuccess(res, { message: "Available slots", data: out });
});

export const getMyReviews = asyncHandler(async (req, res) => {
  const out = await reviewService.getReviewsByLawyer(req.user.id, req.query);
  return sendSuccess(res, { message: "Reviews", data: out.items, meta: out.meta });
});

export const getLawyerReviews = asyncHandler(async (req, res) => {
  const out = await reviewService.getReviewsByLawyer(req.params.lawyerUserId, req.query);
  return sendSuccess(res, { message: "Reviews", data: out.items, meta: out.meta });
});

export const uploadVerificationDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    return sendSuccess(res, { statusCode: 400, message: "No file uploaded", data: null });
  }

  const documentType = req.body.documentType;
  if (!documentType) {
    return sendSuccess(res, { statusCode: 400, message: "documentType is required", data: null });
  }

  const documentUrl = `/uploads/${req.file.filename}`;

  const doc = await verificationService.uploadVerificationDocument({
    lawyerUserId: req.user.id,
    documentType,
    documentUrl,
    fileName: req.file.originalname || req.file.filename
  });

  return sendSuccess(res, { statusCode: 201, message: "Document uploaded successfully", data: doc });
});

export const getVerificationStatus = asyncHandler(async (req, res) => {
  const out = await verificationService.getVerificationStatus(req.user.id);
  return sendSuccess(res, { message: "Verification status", data: out });
});
