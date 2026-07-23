import { ApiError } from "../helpers/apiError.js";
import Booking from "../models/Booking.js";
import Session from "../models/Session.js";
import LawyerProfile from "../models/LawyerProfile.js";
import AdminSetting from "../models/AdminSetting.js";
import LedgerEntry from "../models/LedgerEntry.js";
import Wallet from "../models/Wallet.js";
import * as availabilityService from "./availability.service.js";
import * as walletService from "./wallet.service.js";
import { syncBookingToPlanner, cancelFromBooking as cancelPlannerFromBooking } from "./planner/bookingSync.service.js";
import {
  notifyBookingConfirmed,
  notifyBookingRescheduled,
  notifyBookingCancelled
} from "../notifications/triggers/booking.notifications.js";
import ClientProfile from "../models/ClientProfile.js";
import { BOOKING_STATUS, CONSULTATION_TYPE, LEDGER_TYPES } from "../config/constants.js";
import { toDate, now } from "../utils/time.js";

function parseTimeToMinutes(hhmm) {
  if (!hhmm || !hhmm.includes(":")) return null;
  const [h, m] = hhmm.split(":");
  const hh = Number(h);
  const mm = Number(m);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return hh * 60 + mm;
}

function minutesToTime(mins) {
  const m = ((mins % 1440) + 1440) % 1440;
  const hh = String(Math.floor(m / 60)).padStart(2, "0");
  const mm = String(m % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

async function getAdminSettings() {
  let settings = await AdminSetting.findOne();
  if (!settings) settings = await AdminSetting.create({});
  return settings;
}

const SLOT_DURATION_MINUTES = 30;

export async function createBooking({ clientId, lawyerUserId, startAt, durationMinutes, consultationType = CONSULTATION_TYPE.CHAT_VIDEO, notes = "" }) {
  const start = toDate(startAt);
  if (!start) throw new ApiError(400, "Invalid startAt");
  if (start < now()) throw new ApiError(400, "startAt must be in the future");

  // All consultations are fixed 30-minute slots
  const duration = SLOT_DURATION_MINUTES;

  const end = new Date(start.getTime() + duration * 60 * 1000);

  const dateIso = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
  const startTime = `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`;
  const startM = parseTimeToMinutes(startTime);
  const endM = startM === null ? null : startM + duration;

  const slots = await availabilityService.getAvailableSlots(lawyerUserId, dateIso);
  const fitsAvailability = (slots || []).some((s) => {
    const sM = parseTimeToMinutes(s.start);
    const eM = parseTimeToMinutes(s.end);
    if (sM === null || eM === null || startM === null || endM === null) return false;
    return startM >= sM && endM <= eM;
  });
  if (!fitsAvailability) {
    throw new ApiError(
      400,
      `Selected time is outside lawyer availability (${startTime} - ${minutesToTime(endM || 0)})`
    );
  }

  const windowStart = new Date(start.getTime() - 240 * 60 * 1000);
  const overlappingCandidates = await Booking.find({
    lawyerUserId,
    deletedByClient: { $ne: true },
    deletedByLawyer: { $ne: true },
    status: { $in: [BOOKING_STATUS.BOOKED, BOOKING_STATUS.ACTIVE] },
    startAt: { $lt: end, $gt: windowStart }
  }).lean();

  const overlaps = overlappingCandidates.some((b) => {
    const bStart = new Date(b.startAt);
    const bEnd = new Date(bStart.getTime() + Number(b.durationMinutes || 0) * 60 * 1000);
    return bStart < end && bEnd > start;
  });
  if (overlaps) throw new ApiError(400, "Selected time is already booked");

  const lawyerProfile = await LawyerProfile.findOne({ userId: lawyerUserId });
  if (!lawyerProfile) throw new ApiError(404, "Lawyer not found");

  const settings = await getAdminSettings();

  const hourlyRate = lawyerProfile.hourlyRate || 0;
  const amount = Math.round((hourlyRate * duration) / 60);
  const platformFee = Math.round(amount * (settings.commissionPercent / 100));
  const lawyerEarning = amount - platformFee;

  // Check client has enough credits (when amount > 0)
  if (amount > 0) {
    const wallet = await Wallet.findOne({ userId: clientId });
    if (!wallet) throw new ApiError(400, "Wallet not found. Please contact support.");
    if (wallet.balanceCredits < amount) {
      throw new ApiError(
        400,
        `Insufficient credits. You need ${amount} credits for this consultation. Your balance: ${wallet.balanceCredits}. Please top up your wallet.`
      );
    }
  }

  const booking = await Booking.create({
    clientId,
    lawyerUserId,
    startAt: start,
    durationMinutes: duration,
    consultationType,
    status: BOOKING_STATUS.BOOKED,
    amount,
    platformFee,
    lawyerEarning,
    notes
  });

  // Deduct credits and mark as paid
  if (amount > 0) {
    await walletService.spendCredits(clientId, {
      amount,
      note: `Consultation booking with lawyer`,
      refId: booking._id.toString()
    });
  }
  booking.isPaid = true;
  booking.paidAt = now();
  await booking.save();

  await Session.create({ 
    bookingId: booking._id, 
    status: BOOKING_STATUS.BOOKED,
    allowChat: true,
    allowVideo: consultationType === CONSULTATION_TYPE.VIDEO || consultationType === CONSULTATION_TYPE.CHAT_VIDEO
  });

  await syncBookingToPlanner(booking.toObject());

  notifyBookingConfirmed(booking._id.toString());

  return booking.toObject();
}

export async function activateSession({ bookingId, userId }) {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, "Booking not found");

  if (booking.deletedByClient || booking.deletedByLawyer) {
    throw new ApiError(400, "Booking is deleted");
  }

  const isParticipant =
    booking.clientId.toString() === userId || booking.lawyerUserId.toString() === userId;
  if (!isParticipant) throw new ApiError(403, "Not allowed");

  if (booking.status !== BOOKING_STATUS.BOOKED) throw new ApiError(400, "Booking not in BOOKED state");

  booking.status = BOOKING_STATUS.ACTIVE;
  await booking.save();

  const session = await Session.findOne({ bookingId });
  session.status = BOOKING_STATUS.ACTIVE;
  session.startedAt = now();
  await session.save();

  await syncBookingToPlanner(booking.toObject());

  return session.toObject();
}

export async function completeSession({ bookingId, userId }) {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, "Booking not found");

  if (booking.deletedByClient || booking.deletedByLawyer) {
    throw new ApiError(400, "Booking is deleted");
  }

  const isParticipant =
    booking.clientId.toString() === userId || booking.lawyerUserId.toString() === userId;
  if (!isParticipant) throw new ApiError(403, "Not allowed");

  if (booking.status !== BOOKING_STATUS.ACTIVE) throw new ApiError(400, "Booking not ACTIVE");

  booking.status = BOOKING_STATUS.COMPLETED;
  await booking.save();

  const session = await Session.findOne({ bookingId });
  session.status = BOOKING_STATUS.COMPLETED;
  session.endedAt = now();
  await session.save();

  if (booking.lawyerEarning > 0) {
    await LedgerEntry.create({
      userId: booking.lawyerUserId,
      type: LEDGER_TYPES.EARNING,
      amount: booking.lawyerEarning,
      note: `Consultation earning`,
      refId: booking._id.toString()
    });

    let wallet = await Wallet.findOne({ userId: booking.lawyerUserId });
    if (wallet) {
      wallet.balanceCredits += booking.lawyerEarning;
      await wallet.save();
    }
  }

  await LawyerProfile.findOneAndUpdate(
    { userId: booking.lawyerUserId },
    { $inc: { totalConsultations: 1 } }
  );

  await syncBookingToPlanner(booking.toObject());

  return session.toObject();
}

export async function getBookingById(bookingId) {
  const booking = await Booking.findById(bookingId)
    .populate("clientId", "email")
    .populate("lawyerUserId", "email")
    .lean();
  return booking;
}

export async function rescheduleBooking({ bookingId, clientId, startAt, durationMinutes }) {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, "Booking not found");

  if (booking.deletedByClient || booking.deletedByLawyer) {
    throw new ApiError(400, "Booking is deleted");
  }

  if (booking.clientId.toString() !== clientId) throw new ApiError(403, "Not allowed");
  if (booking.status !== BOOKING_STATUS.BOOKED) {
    throw new ApiError(400, "Only upcoming bookings can be edited");
  }

  const start = toDate(startAt);
  if (!start) throw new ApiError(400, "Invalid startAt");
  if (start < now()) throw new ApiError(400, "startAt must be in the future");

  // Fixed 30-minute slots
  const duration = SLOT_DURATION_MINUTES;

  const end = new Date(start.getTime() + duration * 60 * 1000);
  const dateIso = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
  const startTime = `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`;
  const startM = parseTimeToMinutes(startTime);
  const endM = startM === null ? null : startM + duration;

  const slots = await availabilityService.getAvailableSlots(booking.lawyerUserId, dateIso, booking._id);
  const fitsAvailability = (slots || []).some((s) => {
    const sM = parseTimeToMinutes(s.start);
    const eM = parseTimeToMinutes(s.end);
    if (sM === null || eM === null || startM === null || endM === null) return false;
    return startM >= sM && endM <= eM;
  });
  if (!fitsAvailability) {
    throw new ApiError(
      400,
      `Selected time is outside lawyer availability (${startTime} - ${minutesToTime(endM || 0)})`
    );
  }

  const windowStart = new Date(start.getTime() - 240 * 60 * 1000);
  const overlappingCandidates = await Booking.find({
    _id: { $ne: booking._id },
    lawyerUserId: booking.lawyerUserId,
    deletedByClient: { $ne: true },
    deletedByLawyer: { $ne: true },
    status: { $in: [BOOKING_STATUS.BOOKED, BOOKING_STATUS.ACTIVE] },
    startAt: { $lt: end, $gt: windowStart }
  }).lean();

  const overlaps = overlappingCandidates.some((b) => {
    const bStart = new Date(b.startAt);
    const bEnd = new Date(bStart.getTime() + Number(b.durationMinutes || 0) * 60 * 1000);
    return bStart < end && bEnd > start;
  });
  if (overlaps) throw new ApiError(400, "Selected time is already booked");

  const lawyerProfile = await LawyerProfile.findOne({ userId: booking.lawyerUserId });
  if (!lawyerProfile) throw new ApiError(404, "Lawyer not found");

  const previousStartAt = booking.startAt;
  const clientProfile = await ClientProfile.findOne({ userId: booking.clientId }).lean();

  const settings = await getAdminSettings();
  const hourlyRate = lawyerProfile.hourlyRate || 0;
  const amount = Math.round((hourlyRate * duration) / 60);
  const platformFee = Math.round(amount * (settings.commissionPercent / 100));
  const lawyerEarning = amount - platformFee;

  booking.startAt = start;
  booking.durationMinutes = duration;
  booking.amount = amount;
  booking.platformFee = platformFee;
  booking.lawyerEarning = lawyerEarning;
  booking.reminderMinutesSent = [];
  await booking.save();

  await syncBookingToPlanner(booking.toObject());

  notifyBookingRescheduled(booking._id.toString(), {
    previousStartAt,
    rescheduledByRole: "client",
    rescheduledByName: clientProfile?.fullName || "The client"
  });

  return booking.toObject();
}

export async function deleteBookingForClient({ bookingId, clientId }) {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, "Booking not found");

  if (booking.clientId.toString() !== clientId) throw new ApiError(403, "Not allowed");

  booking.deletedByClient = true;
  booking.deletedByLawyer = true;
  await booking.save();
  await cancelPlannerFromBooking(booking._id);
  notifyBookingCancelled(booking._id.toString(), { cancelledByRole: "client" });
  return { ok: true };
}

export async function rescheduleBookingAsLawyer({ bookingId, lawyerUserId, startAt, durationMinutes }) {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, "Booking not found");

  if (booking.deletedByClient || booking.deletedByLawyer) {
    throw new ApiError(400, "Booking is deleted");
  }

  if (booking.lawyerUserId.toString() !== lawyerUserId) throw new ApiError(403, "Not allowed");
  if (booking.status !== BOOKING_STATUS.BOOKED) {
    throw new ApiError(400, "Only upcoming bookings can be edited");
  }

  const start = toDate(startAt);
  if (!start) throw new ApiError(400, "Invalid startAt");
  if (start < now()) throw new ApiError(400, "startAt must be in the future");

  // Fixed 30-minute slots
  const duration = SLOT_DURATION_MINUTES;

  const end = new Date(start.getTime() + duration * 60 * 1000);
  const dateIso = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
  const startTime = `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`;
  const startM = parseTimeToMinutes(startTime);
  const endM = startM === null ? null : startM + duration;

  const slots = await availabilityService.getAvailableSlots(booking.lawyerUserId, dateIso, booking._id);
  const fitsAvailability = (slots || []).some((s) => {
    const sM = parseTimeToMinutes(s.start);
    const eM = parseTimeToMinutes(s.end);
    if (sM === null || eM === null || startM === null || endM === null) return false;
    return startM >= sM && endM <= eM;
  });
  if (!fitsAvailability) {
    throw new ApiError(
      400,
      `Selected time is outside lawyer availability (${startTime} - ${minutesToTime(endM || 0)})`
    );
  }

  const windowStart = new Date(start.getTime() - 240 * 60 * 1000);
  const overlappingCandidates = await Booking.find({
    _id: { $ne: booking._id },
    lawyerUserId: booking.lawyerUserId,
    deletedByClient: { $ne: true },
    deletedByLawyer: { $ne: true },
    status: { $in: [BOOKING_STATUS.BOOKED, BOOKING_STATUS.ACTIVE] },
    startAt: { $lt: end, $gt: windowStart }
  }).lean();

  const overlaps = overlappingCandidates.some((b) => {
    const bStart = new Date(b.startAt);
    const bEnd = new Date(bStart.getTime() + Number(b.durationMinutes || 0) * 60 * 1000);
    return bStart < end && bEnd > start;
  });
  if (overlaps) throw new ApiError(400, "Selected time is already booked");

  const lawyerProfile = await LawyerProfile.findOne({ userId: booking.lawyerUserId });
  if (!lawyerProfile) throw new ApiError(404, "Lawyer not found");

  const previousStartAt = booking.startAt;
  const clientProfile = await ClientProfile.findOne({ userId: booking.clientId }).lean();

  const settings = await getAdminSettings();
  const hourlyRate = lawyerProfile.hourlyRate || 0;
  const amount = Math.round((hourlyRate * duration) / 60);
  const platformFee = Math.round(amount * (settings.commissionPercent / 100));
  const lawyerEarning = amount - platformFee;

  booking.startAt = start;
  booking.durationMinutes = duration;
  booking.amount = amount;
  booking.platformFee = platformFee;
  booking.lawyerEarning = lawyerEarning;
  booking.reminderMinutesSent = [];
  await booking.save();

  await syncBookingToPlanner(booking.toObject());

  notifyBookingRescheduled(booking._id.toString(), {
    previousStartAt,
    rescheduledByRole: "lawyer",
    rescheduledByName: lawyerProfile.fullName || "The lawyer"
  });

  return booking.toObject();
}

export async function deleteBookingForLawyer({ bookingId, lawyerUserId }) {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, "Booking not found");

  if (booking.lawyerUserId.toString() !== lawyerUserId) throw new ApiError(403, "Not allowed");

  booking.deletedByLawyer = true;
  booking.deletedByClient = true;
  await booking.save();
  await cancelPlannerFromBooking(booking._id);
  notifyBookingCancelled(booking._id.toString(), { cancelledByRole: "lawyer" });
  return { ok: true };
}
