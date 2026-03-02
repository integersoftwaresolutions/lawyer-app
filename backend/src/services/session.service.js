import { ApiError } from "../helpers/apiError.js";
import { BOOKING_STATUS } from "../config/constants.js";
import Booking from "../models/Booking.js";
import Session from "../models/Session.js";
import { now } from "../utils/time.js";

export async function getOrCreateSession(bookingId) {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, "Booking not found");

  let session = await Session.findOne({ bookingId });
  if (!session) session = await Session.create({ bookingId, status: booking.status });

  // auto-expire if past end time and not completed
  const endTime = new Date(new Date(booking.startAt).getTime() + booking.durationMinutes * 60000);
  if ([BOOKING_STATUS.BOOKED, BOOKING_STATUS.ACTIVE].includes(session.status) && now() > endTime) {
    session.status = BOOKING_STATUS.EXPIRED;
    session.endedAt = endTime;
    await session.save();
  }

  return session;
}
