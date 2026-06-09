import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../helpers/response.helper.js";
import * as clientService from "../services/client.service.js";
import * as reviewService from "../services/review.service.js";
import * as bookingService from "../services/booking.service.js";
import * as disputeService from "../services/dispute.service.js";

export const getMyProfile = asyncHandler(async (req, res) => {
  const out = await clientService.getClientProfile(req.user.id);
  return sendSuccess(res, { message: "My profile", data: out });
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const out = await clientService.updateClientProfile(req.user.id, req.body);
  return sendSuccess(res, { message: "Profile updated", data: out });
});

export const getMyBookings = asyncHandler(async (req, res) => {
  const out = await clientService.getClientBookings(req.user.id, req.query);
  return sendSuccess(res, { message: "Bookings", data: out.items, meta: out.meta });
});

export const rescheduleMyBooking = asyncHandler(async (req, res) => {
  const out = await bookingService.rescheduleBooking({
    bookingId: req.params.bookingId,
    clientId: req.user.id,
    startAt: req.body.startAt,
    durationMinutes: req.body.durationMinutes
  });
  return sendSuccess(res, { message: "Booking updated", data: out });
});

export const deleteMyBooking = asyncHandler(async (req, res) => {
  const out = await bookingService.deleteBookingForClient({
    bookingId: req.params.bookingId,
    clientId: req.user.id
  });
  return sendSuccess(res, { message: "Booking deleted", data: out });
});

export const getMyStats = asyncHandler(async (req, res) => {
  const out = await clientService.getClientStats(req.user.id);
  return sendSuccess(res, { message: "Stats", data: out });
});

export const createReview = asyncHandler(async (req, res) => {
  const out = await reviewService.createReview({
    bookingId: req.body.bookingId,
    clientId: req.user.id,
    rating: req.body.rating,
    comment: req.body.comment
  });
  return sendSuccess(res, { statusCode: 201, message: "Review created", data: out });
});

export const getMyReviews = asyncHandler(async (req, res) => {
  const out = await reviewService.getReviewsByClient(req.user.id, req.query);
  return sendSuccess(res, { message: "Reviews", data: out.items, meta: out.meta });
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
  return sendSuccess(res, { message: "Disputes", data: out.items, meta: out.meta });
});
