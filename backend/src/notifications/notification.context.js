import Booking from "../models/Booking.js";
import ClientProfile from "../models/ClientProfile.js";
import LawyerProfile from "../models/LawyerProfile.js";
import User from "../models/User.js";
import VerificationDocument from "../models/VerificationDocument.js";
import { DOCUMENT_TYPES, ROLES, VERIFICATION_STATUS } from "../config/constants.js";
import { appUrl, formatDateTime, consultationTypeLabel } from "./helpers/format.js";
import { documentTypeLabel } from "./helpers/labels.js";
import { env } from "../config/env.js";

function greetingName(name) {
  return name?.trim() ? ` ${name.trim()}` : "";
}

function notesBlock(notes) {
  if (!notes?.trim()) return "";
  return `<p><span class="info-label">Notes:</span> ${notes.trim()}</p>`;
}

export async function getAdminRecipients() {
  const admins = await User.find({ role: ROLES.ADMIN }).select("email _id").lean();
  return admins.map((a) => ({
    email: a.email,
    userId: a._id.toString(),
    name: "Admin"
  }));
}

export async function loadBookingContext(bookingId) {
  const booking = await Booking.findById(bookingId)
    .populate("clientId", "email")
    .populate("lawyerUserId", "email")
    .lean();
  if (!booking) return null;

  const clientId = booking.clientId?._id || booking.clientId;
  const lawyerUserId = booking.lawyerUserId?._id || booking.lawyerUserId;

  const [clientProfile, lawyerProfile] = await Promise.all([
    ClientProfile.findOne({ userId: clientId }).lean(),
    LawyerProfile.findOne({ userId: lawyerUserId }).lean()
  ]);

  const scheduledAt = formatDateTime(booking.startAt);
  const clientName = clientProfile?.fullName || "Client";
  const lawyerName = lawyerProfile?.fullName || "Lawyer";

  return {
    booking,
    client: {
      email: booking.clientId?.email,
      userId: clientId?.toString(),
      name: clientName,
      bookingsUrl: appUrl("/client/bookings")
    },
    lawyer: {
      email: booking.lawyerUserId?.email,
      userId: lawyerUserId?.toString(),
      name: lawyerName,
      bookingsUrl: appUrl("/lawyer/bookings")
    },
    scheduledAt,
    durationMinutes: String(booking.durationMinutes || 30),
    consultationType: consultationTypeLabel(booking.consultationType),
    sessionUrl: appUrl(`/chat/${booking._id}`),
    bookingId: booking._id.toString()
  };
}

export function buildBookingConfirmedPayload(ctx, role) {
  const isClient = role === "client";
  const recipient = isClient ? ctx.client : ctx.lawyer;
  const counterparty = isClient ? ctx.lawyer : ctx.client;

  return {
    recipientEmail: recipient.email,
    userId: recipient.userId,
    variables: {
      headline: "Booking confirmed",
      preheader: `Your consultation on ${ctx.scheduledAt} is confirmed`,
      recipientName: greetingName(recipient.name),
      counterpartyName: counterparty.name,
      scheduledAt: ctx.scheduledAt,
      durationMinutes: ctx.durationMinutes,
      consultationType: ctx.consultationType,
      bookingUrl: recipient.bookingsUrl
    }
  };
}

export function buildBookingReminderPayload(ctx, role, reminderLabel) {
  const isClient = role === "client";
  const recipient = isClient ? ctx.client : ctx.lawyer;
  const counterparty = isClient ? ctx.lawyer : ctx.client;

  return {
    recipientEmail: recipient.email,
    userId: recipient.userId,
    variables: {
      headline: "Consultation reminder",
      preheader: `Reminder: consultation in ${reminderLabel}`,
      recipientName: greetingName(recipient.name),
      counterpartyName: counterparty.name,
      scheduledAt: ctx.scheduledAt,
      durationMinutes: ctx.durationMinutes,
      consultationType: ctx.consultationType,
      reminderLabel,
      sessionUrl: ctx.sessionUrl
    }
  };
}

export function buildBookingRescheduledPayload(ctx, role, { previousScheduledAt, rescheduledByName }) {
  const isClient = role === "client";
  const recipient = isClient ? ctx.client : ctx.lawyer;
  const counterparty = isClient ? ctx.lawyer : ctx.client;

  return {
    recipientEmail: recipient.email,
    userId: recipient.userId,
    variables: {
      headline: "Booking rescheduled",
      preheader: `Consultation moved to ${ctx.scheduledAt}`,
      recipientName: greetingName(recipient.name),
      counterpartyName: counterparty.name,
      scheduledAt: ctx.scheduledAt,
      previousScheduledAt,
      durationMinutes: ctx.durationMinutes,
      rescheduledByName,
      bookingUrl: recipient.bookingsUrl
    }
  };
}

export function buildBookingCancelledPayload(ctx, role, { cancelledByRole }) {
  const isClient = role === "client";
  const recipient = isClient ? ctx.client : ctx.lawyer;
  const counterparty = isClient ? ctx.lawyer : ctx.client;
  const cancelledByText =
    cancelledByRole === "client"
      ? " by the client"
      : cancelledByRole === "lawyer"
        ? " by the lawyer"
        : "";

  return {
    recipientEmail: recipient.email,
    userId: recipient.userId,
    variables: {
      headline: "Booking cancelled",
      preheader: `Consultation on ${ctx.scheduledAt} was cancelled`,
      recipientName: greetingName(recipient.name),
      counterpartyName: counterparty.name,
      scheduledAt: ctx.scheduledAt,
      cancelledByText,
      bookingUrl: recipient.bookingsUrl
    }
  };
}

export async function loadLawyerVerificationContext(lawyerUserId) {
  const [user, profile] = await Promise.all([
    User.findById(lawyerUserId).select("email").lean(),
    LawyerProfile.findOne({ userId: lawyerUserId }).lean()
  ]);
  if (!user) return null;

  return {
    email: user.email,
    userId: lawyerUserId.toString(),
    name: profile?.fullName || "Lawyer",
    verificationUrl: appUrl("/lawyer/verification"),
    dashboardUrl: appUrl("/lawyer/overview")
  };
}

export function buildOtpVariables({ otpCode, purpose }) {
  const expiryMinutes = env.otpExpiryMinutes.toString();
  if (purpose === "PASSWORD_RESET") {
    return {
      headline: "Reset your password",
      preheader: "Your password reset code",
      otpCode,
      expiryMinutes,
      resetUrl: appUrl("/forgot-password")
    };
  }
  return {
    headline: "Verify your email",
    preheader: "Your email verification code",
    otpCode,
    expiryMinutes,
    verifyUrl: appUrl("/verify-email")
  };
}

export async function shouldNotifyAdminPendingVerification(lawyerUserId) {
  const profile = await LawyerProfile.findOne({ userId: lawyerUserId }).lean();
  if (!profile || profile.verificationStatus !== VERIFICATION_STATUS.PENDING) return false;

  const requiredTypes = [DOCUMENT_TYPES.BAR_LICENSE, DOCUMENT_TYPES.GOVERNMENT_ID];
  const docs = await VerificationDocument.find({
    lawyerUserId,
    documentType: { $in: requiredTypes },
    status: VERIFICATION_STATUS.PENDING
  }).lean();

  const types = new Set(docs.map((d) => d.documentType));
  return requiredTypes.every((t) => types.has(t));
}

export function buildPlannerReminderVariables(event, reminderLabel) {
  const locationBlock = event.location?.trim()
    ? `<p><span class="info-label">Location:</span> ${event.location.trim()}</p>`
    : "";

  const plannerPath =
    event.ownerRole === "CLIENT" ? "/client/bookings" : "/lawyer/planner";

  return {
    headline: "Planner reminder",
    preheader: `${event.title} starts in ${reminderLabel}`,
    recipientName: "",
    eventTitle: event.title,
    scheduledAt: formatDateTime(event.startAt),
    eventType: event.eventType?.replace(/_/g, " ") || "Event",
    reminderLabel,
    locationBlock,
    plannerUrl: appUrl(plannerPath)
  };
}

export { greetingName, notesBlock, documentTypeLabel };
