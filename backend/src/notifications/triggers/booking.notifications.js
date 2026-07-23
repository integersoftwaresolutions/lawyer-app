import { NOTIFICATION_TYPES } from "../../config/notification.constants.js";
import { notify, notifyAsync } from "../notification.service.js";
import {
  loadBookingContext,
  buildBookingConfirmedPayload,
  buildBookingReminderPayload,
  buildBookingRescheduledPayload,
  buildBookingCancelledPayload
} from "../notification.context.js";

export async function notifyBookingConfirmed(bookingId) {
  const ctx = await loadBookingContext(bookingId);
  if (!ctx) return;

  notifyAsync(NOTIFICATION_TYPES.BOOKING_CONFIRMED, [
    buildBookingConfirmedPayload(ctx, "client"),
    buildBookingConfirmedPayload(ctx, "lawyer")
  ], { metadata: { bookingId: ctx.bookingId } });
}

export async function notifyBookingRescheduled(bookingId, { previousStartAt, rescheduledByRole, rescheduledByName }) {
  const ctx = await loadBookingContext(bookingId);
  if (!ctx) return;

  const { formatDateTime } = await import("./helpers/format.js");
  const prevFormatted = formatDateTime(previousStartAt);

  const otherRole = rescheduledByRole === "client" ? "lawyer" : "client";

  notifyAsync(NOTIFICATION_TYPES.BOOKING_RESCHEDULED, [
    buildBookingRescheduledPayload(ctx, otherRole, {
      previousScheduledAt: prevFormatted,
      rescheduledByName
    })
  ], { metadata: { bookingId: ctx.bookingId } });
}

export async function notifyBookingCancelled(bookingId, { cancelledByRole }) {
  const ctx = await loadBookingContext(bookingId);
  if (!ctx) return;

  const otherRole = cancelledByRole === "client" ? "lawyer" : "client";

  notifyAsync(NOTIFICATION_TYPES.BOOKING_CANCELLED, [
    buildBookingCancelledPayload(ctx, otherRole, { cancelledByRole })
  ], { metadata: { bookingId: ctx.bookingId } });
}

export async function notifyBookingReminder(bookingId, reminderMinutes, reminderLabel) {
  const ctx = await loadBookingContext(bookingId);
  if (!ctx) return;

  await notify(NOTIFICATION_TYPES.BOOKING_REMINDER, [
    buildBookingReminderPayload(ctx, "client", reminderLabel),
    buildBookingReminderPayload(ctx, "lawyer", reminderLabel)
  ], { metadata: { bookingId: ctx.bookingId, reminderMinutes } });
}
