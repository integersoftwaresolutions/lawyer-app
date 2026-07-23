import Booking from "../models/Booking.js";
import PlannerEvent from "../models/PlannerEvent.js";
import User from "../models/User.js";
import { BOOKING_STATUS } from "../config/constants.js";
import { BOOKING_REMINDER_MINUTES, getReminderWindowMs } from "../config/notification.config.js";
import { env } from "../config/env.js";
import { NOTIFICATION_TYPES } from "../config/notification.constants.js";
import { formatReminderLabel } from "../notifications/helpers/format.js";
import { notify } from "../notifications/notification.service.js";
import { buildPlannerReminderVariables } from "../notifications/notification.context.js";
import { notifyBookingReminder } from "../notifications/triggers/booking.notifications.js";

let isRunning = false;

async function processBookingReminders() {
  const windowMs = getReminderWindowMs(env.reminderJobIntervalMs);
  const now = Date.now();

  for (const offsetMinutes of BOOKING_REMINDER_MINUTES) {
    const fireAt = now + offsetMinutes * 60 * 1000;
    const bookings = await Booking.find({
      status: BOOKING_STATUS.BOOKED,
      deletedByClient: { $ne: true },
      deletedByLawyer: { $ne: true },
      startAt: {
        $gte: new Date(fireAt - windowMs),
        $lte: new Date(fireAt + windowMs)
      },
      reminderMinutesSent: { $nin: [offsetMinutes] }
    })
      .select("_id")
      .lean();

    for (const booking of bookings) {
      const label = formatReminderLabel(offsetMinutes);
      await notifyBookingReminder(booking._id.toString(), offsetMinutes, label);
      await Booking.updateOne(
        { _id: booking._id },
        { $addToSet: { reminderMinutesSent: offsetMinutes } }
      );
    }
  }
}

async function processPlannerReminders() {
  const windowMs = getReminderWindowMs(env.reminderJobIntervalMs);
  const now = Date.now();

  const events = await PlannerEvent.find({
    isCancelled: { $ne: true },
    startAt: { $gt: new Date(now) },
    reminders: { $exists: true, $ne: [] }
  })
    .select("ownerId title eventType startAt location reminders remindersSent ownerRole")
    .lean();

  for (const event of events) {
    const pendingOffsets = (event.reminders || []).filter(
      (m) => !(event.remindersSent || []).includes(m)
    );
    if (!pendingOffsets.length) continue;

    const owner = await User.findById(event.ownerId).select("email").lean();
    if (!owner?.email) continue;

    for (const offsetMinutes of pendingOffsets) {
      const fireAt = now + offsetMinutes * 60 * 1000;
      const startMs = new Date(event.startAt).getTime();
      if (startMs < fireAt - windowMs || startMs > fireAt + windowMs) continue;

      const label = formatReminderLabel(offsetMinutes);
      const variables = buildPlannerReminderVariables(event, label);

      await notify(
        NOTIFICATION_TYPES.PLANNER_REMINDER,
        [{ email: owner.email, userId: event.ownerId.toString(), variables }],
        { metadata: { plannerEventId: event._id.toString(), offsetMinutes } }
      );

      await PlannerEvent.updateOne(
        { _id: event._id },
        { $addToSet: { remindersSent: offsetMinutes } }
      );
    }
  }
}

export async function processScheduledReminders() {
  if (isRunning) return;
  isRunning = true;
  try {
    await processBookingReminders();
    await processPlannerReminders();
  } catch (error) {
    console.error("[reminder.job] Error:", error);
  } finally {
    isRunning = false;
  }
}

export function startReminderJob() {
  const intervalMs = env.reminderJobIntervalMs;
  console.log(`⏰ Reminder job scheduled every ${Math.round(intervalMs / 1000)}s`);

  processScheduledReminders().catch((err) => {
    console.error("[reminder.job] Initial run failed:", err);
  });

  return setInterval(() => {
    processScheduledReminders().catch((err) => {
      console.error("[reminder.job] Scheduled run failed:", err);
    });
  }, intervalMs);
}
