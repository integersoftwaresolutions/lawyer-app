/** Shared calendar constants — used by lawyer & future client planners. */

export const DEFAULT_TIMEZONE = "Asia/Karachi";

export const CALENDAR_VIEWS = {
  DAY: "day",
  WEEK: "week",
  MONTH: "month"
};

export const EVENT_TYPES = {
  COURT_HEARING: "COURT_HEARING",
  CLIENT_MEETING: "CLIENT_MEETING",
  INTERNAL: "INTERNAL",
  DEADLINE: "DEADLINE",
  OTHER: "OTHER",
  PLATFORM_BOOKING: "PLATFORM_BOOKING"
};

export const EVENT_SOURCES = {
  MANUAL: "MANUAL",
  BOOKING: "BOOKING"
};

export const EVENT_VISIBILITY = {
  PRIVATE: "PRIVATE",
  SHARED: "SHARED"
};

/** Manual types lawyers/clients can create via the UI. */
export const MANUAL_EVENT_TYPES = [
  EVENT_TYPES.COURT_HEARING,
  EVENT_TYPES.CLIENT_MEETING,
  EVENT_TYPES.INTERNAL,
  EVENT_TYPES.DEADLINE,
  EVENT_TYPES.OTHER
];

export const EVENT_TYPE_LABELS = {
  [EVENT_TYPES.COURT_HEARING]: "Court Hearing",
  [EVENT_TYPES.CLIENT_MEETING]: "Client Meeting",
  [EVENT_TYPES.INTERNAL]: "Internal",
  [EVENT_TYPES.DEADLINE]: "Deadline",
  [EVENT_TYPES.OTHER]: "Other",
  [EVENT_TYPES.PLATFORM_BOOKING]: "Platform Booking"
};

export const EVENT_COLOR_TOKENS = {
  [EVENT_TYPES.COURT_HEARING]: "red",
  [EVENT_TYPES.CLIENT_MEETING]: "blue",
  [EVENT_TYPES.INTERNAL]: "gray",
  [EVENT_TYPES.DEADLINE]: "orange",
  [EVENT_TYPES.OTHER]: "purple",
  [EVENT_TYPES.PLATFORM_BOOKING]: "green"
};

/** Tailwind classes keyed by colour token from backend. */
export const EVENT_COLOR_STYLES = {
  red: {
    chip: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
    block: "bg-red-500 border-red-600",
    dot: "bg-red-500"
  },
  blue: {
    chip: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
    block: "bg-blue-500 border-blue-600",
    dot: "bg-blue-500"
  },
  gray: {
    chip: "bg-gray-500/15 text-gray-700 dark:text-gray-300 border-gray-500/30",
    block: "bg-gray-500 border-gray-600",
    dot: "bg-gray-500"
  },
  orange: {
    chip: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
    block: "bg-orange-500 border-orange-600",
    dot: "bg-orange-500"
  },
  purple: {
    chip: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
    block: "bg-purple-500 border-purple-600",
    dot: "bg-purple-500"
  },
  green: {
    chip: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    block: "bg-emerald-500 border-emerald-600",
    dot: "bg-emerald-500"
  }
};

export const REMINDER_OPTIONS = [
  { value: 15, label: "15 minutes before" },
  { value: 60, label: "1 hour before" },
  { value: 1440, label: "1 day before" },
  { value: 10080, label: "1 week before" }
];

export const HOUR_START = 6;
export const HOUR_END = 22;
export const HOUR_HEIGHT = 56;

export function getEventColorStyles(event) {
  const token = event?.color || EVENT_COLOR_TOKENS[event?.eventType] || "gray";
  return EVENT_COLOR_STYLES[token] || EVENT_COLOR_STYLES.gray;
}

export function isPlatformEvent(event) {
  return event?.source === EVENT_SOURCES.BOOKING;
}

export const CONSULTATION_TYPE_LABELS = {
  CHAT: "Chat",
  VIDEO: "Video",
  CHAT_VIDEO: "Chat + Video"
};
