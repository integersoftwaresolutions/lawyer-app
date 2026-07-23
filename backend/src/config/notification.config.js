/** Booking reminder offsets in minutes (24h and 1h before start). */
export const BOOKING_REMINDER_MINUTES = [1440, 60];

/** Grace window (ms) around each reminder fire time — half the job interval. */
export function getReminderWindowMs(intervalMs) {
  return Math.max(intervalMs / 2, 2.5 * 60 * 1000);
}
