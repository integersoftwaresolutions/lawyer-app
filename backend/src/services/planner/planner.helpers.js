import { ApiError } from "../../helpers/apiError.js";
import { toDate } from "../../utils/time.js";
import {
  PLANNER_EVENT_COLORS,
  PLANNER_DEFAULT_TIMEZONE,
  PLANNER_MAX_RANGE_DAYS,
  PLANNER_EVENT_SOURCES,
  PLATFORM_EVENT_EDITABLE_FIELDS,
  PLATFORM_EVENT_LOCKED_FIELDS
} from "../../config/planner.config.js";
import { buildOwnerFilter } from "./calendar.context.js";
import { CALENDAR_OWNER_ROLES } from "../../config/constants.js";

export function resolveEventColor(eventType, storedColor) {
  if (storedColor) return storedColor;
  return PLANNER_EVENT_COLORS[eventType] || "gray";
}

export function formatPlannerEvent(doc) {
  if (!doc) return null;
  const d = doc.toObject ? doc.toObject() : doc;
  return {
    id: d._id,
    ownerId: d.ownerId,
    ownerRole: d.ownerRole,
    /** @deprecated use ownerId — kept for backward compatibility during migration */
    lawyerId: d.ownerRole === CALENDAR_OWNER_ROLES.LAWYER ? d.ownerId : null,
    title: d.title,
    eventType: d.eventType,
    startAt: d.startAt,
    endAt: d.endAt,
    timezone: d.timezone || PLANNER_DEFAULT_TIMEZONE,
    caseRef: d.caseRef || "",
    location: d.location || "",
    notes: d.notes || "",
    reminders: d.reminders || [],
    visibility: d.visibility,
    source: d.source,
    bookingId: d.bookingId || null,
    color: resolveEventColor(d.eventType, d.color),
    clientName: d.clientName || "",
    consultationType: d.consultationType || "",
    isCancelled: Boolean(d.isCancelled),
    metadata: d.metadata || {},
    createdAt: d.createdAt,
    updatedAt: d.updatedAt
  };
}

export function assertValidRange(startAt, endAt) {
  const start = toDate(startAt);
  const end = toDate(endAt);
  if (!start || !end) throw new ApiError(400, "Invalid startAt or endAt");
  if (end <= start) throw new ApiError(400, "endAt must be after startAt");
  return { start, end };
}

export function assertQueryWindow(from, to) {
  const start = toDate(from);
  const end = toDate(to);
  if (!start || !end) throw new ApiError(400, "Query params 'from' and 'to' are required ISO dates");
  if (end <= start) throw new ApiError(400, "'to' must be after 'from'");

  const maxMs = PLANNER_MAX_RANGE_DAYS * 24 * 60 * 60 * 1000;
  if (end.getTime() - start.getTime() > maxMs) {
    throw new ApiError(400, `Date range cannot exceed ${PLANNER_MAX_RANGE_DAYS} days`);
  }

  return { start, end };
}

export function buildOverlapFilter({ owner, startAt, endAt, excludeEventId = null }) {
  const filter = {
    ...buildOwnerFilter(owner),
    isCancelled: false,
    startAt: { $lt: endAt },
    endAt: { $gt: startAt }
  };
  if (excludeEventId) filter._id = { $ne: excludeEventId };
  return filter;
}

export function isPlatformEvent(event) {
  return event?.source === PLANNER_EVENT_SOURCES.BOOKING;
}

export function assertManualEventEditable(event) {
  if (isPlatformEvent(event)) {
    throw new ApiError(403, "Platform bookings cannot be deleted from the planner. Cancel the booking instead.");
  }
}

export function filterPlatformPatchPayload(payload, event) {
  if (!isPlatformEvent(event)) return payload;

  const keys = Object.keys(payload || {});
  const blocked = keys.filter(
    (k) => PLATFORM_EVENT_LOCKED_FIELDS.has(k) && payload[k] !== undefined
  );
  if (blocked.length) {
    throw new ApiError(
      403,
      `Platform booking events only allow editing: ${[...PLATFORM_EVENT_EDITABLE_FIELDS].join(", ")}`
    );
  }

  const allowed = {};
  for (const key of keys) {
    if (PLATFORM_EVENT_EDITABLE_FIELDS.has(key)) allowed[key] = payload[key];
  }
  return allowed;
}

export function startEndOfToday(timezone = PLANNER_DEFAULT_TIMEZONE) {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const datePart = formatter.format(now);
  const start = new Date(`${datePart}T00:00:00+05:00`);
  const end = new Date(`${datePart}T23:59:59.999+05:00`);
  return { start, end };
}
