import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../helpers/response.helper.js";
import * as bookingService from "../services/booking.service.js";
import * as sessionService from "../services/session.service.js";

export const create = asyncHandler(async (req, res) => {
  const out = await bookingService.createBooking({
    clientId: req.user.id,
    lawyerUserId: req.body.lawyerUserId,
    startAt: req.body.startAt,
    durationMinutes: req.body.durationMinutes,
    consultationType: req.body.consultationType,
    notes: req.body.notes
  });

  return sendSuccess(res, { statusCode: 201, message: "Booking created", data: out });
});

export const getBooking = asyncHandler(async (req, res) => {
  const out = await bookingService.getBookingById(req.params.bookingId);
  return sendSuccess(res, { message: "Booking", data: out });
});

export const activate = asyncHandler(async (req, res) => {
  const out = await bookingService.activateSession({ bookingId: req.params.bookingId, userId: req.user.id });
  return sendSuccess(res, { message: "Session activated", data: out });
});

export const complete = asyncHandler(async (req, res) => {
  const out = await bookingService.completeSession({ bookingId: req.params.bookingId, userId: req.user.id });
  return sendSuccess(res, { message: "Session completed", data: out });
});

export const session = asyncHandler(async (req, res) => {
  const out = await sessionService.getOrCreateSession(req.params.bookingId);
  return sendSuccess(res, { message: "Session", data: out });
});
