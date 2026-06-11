import {
  PLANNER_EVENT_TYPES,
  PLANNER_EVENT_SOURCES,
  PLANNER_EVENT_VISIBILITY
} from "../config/constants.js";

/** Allowed reminder offsets in minutes (15m, 1h, 1d, 1w). */
export const PLANNER_REMINDER_MINUTES = [15, 60, 1440, 10080];

export const PLANNER_DEFAULT_TIMEZONE = "Asia/Karachi";

/** Max range for calendar queries (days) — prevents unbounded scans. */
export const PLANNER_MAX_RANGE_DAYS = 366;

/** UI colour tokens per event type (frontend maps to Tailwind). */
export const PLANNER_EVENT_COLORS = {
  [PLANNER_EVENT_TYPES.COURT_HEARING]: "red",
  [PLANNER_EVENT_TYPES.CLIENT_MEETING]: "blue",
  [PLANNER_EVENT_TYPES.INTERNAL]: "gray",
  [PLANNER_EVENT_TYPES.DEADLINE]: "orange",
  [PLANNER_EVENT_TYPES.OTHER]: "purple",
  [PLANNER_EVENT_TYPES.PLATFORM_BOOKING]: "green"
};

/** Fields lawyers may edit on platform-synced events. */
export const PLATFORM_EVENT_EDITABLE_FIELDS = new Set(["notes", "reminders"]);

/** Fields blocked on platform-synced events. */
export const PLATFORM_EVENT_LOCKED_FIELDS = new Set([
  "title",
  "eventType",
  "startAt",
  "endAt",
  "caseRef",
  "location",
  "visibility",
  "source",
  "bookingId",
  "timezone"
]);

export { PLANNER_EVENT_TYPES, PLANNER_EVENT_SOURCES, PLANNER_EVENT_VISIBILITY };
