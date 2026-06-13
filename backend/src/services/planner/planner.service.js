import { ApiError } from "../../helpers/apiError.js";
import PlannerEvent from "../../models/PlannerEvent.js";
import {
  PLANNER_EVENT_TYPES,
  PLANNER_EVENT_SOURCES,
  PLANNER_DEFAULT_TIMEZONE
} from "../../config/planner.config.js";
import { CALENDAR_OWNER_ROLES } from "../../config/constants.js";
import { buildOwnerFilter } from "./calendar.context.js";
import {
  assertValidRange,
  assertQueryWindow,
  buildOverlapFilter,
  formatPlannerEvent,
  assertManualEventEditable,
  filterPlatformPatchPayload,
  resolveEventColor,
  startEndOfToday
} from "./planner.helpers.js";
import { reconcileBookingsForOwner } from "./bookingSync.service.js";
export { syncFromBooking, cancelFromBooking } from "./bookingSync.service.js";

async function getOwnedEvent(eventId, owner) {
  const event = await PlannerEvent.findOne({
    _id: eventId,
    ...buildOwnerFilter(owner),
    isCancelled: false
  });
  if (!event) throw new ApiError(404, "Event not found");
  return event;
}

export async function createEvent(owner, payload) {
  const { start, end } = assertValidRange(
    payload.startAt,
    payload.endAt,
    payload.timezone || PLANNER_DEFAULT_TIMEZONE
  );

  if (payload.source && payload.source !== PLANNER_EVENT_SOURCES.MANUAL) {
    throw new ApiError(400, "Manual API cannot create platform booking events");
  }

  const eventType = payload.eventType;
  if (eventType === PLANNER_EVENT_TYPES.PLATFORM_BOOKING) {
    throw new ApiError(400, "Use booking sync for platform events");
  }

  const event = await PlannerEvent.create({
    ownerId: owner.ownerId,
    ownerRole: owner.ownerRole,
    title: payload.title.trim(),
    eventType,
    startAt: start,
    endAt: end,
    timezone: payload.timezone || PLANNER_DEFAULT_TIMEZONE,
    caseRef: payload.caseRef?.trim() || "",
    location: payload.location?.trim() || "",
    notes: payload.notes || "",
    reminders: payload.reminders || [],
    visibility: payload.visibility,
    source: PLANNER_EVENT_SOURCES.MANUAL,
    color: resolveEventColor(eventType)
  });

  return formatPlannerEvent(event);
}

export async function listEvents(owner, query = {}) {
  const { start, end } = assertQueryWindow(query.from, query.to);

  await reconcileBookingsForOwner(owner, { from: start, to: end });

  const filter = {
    ...buildOwnerFilter(owner),
    isCancelled: false,
    startAt: { $lt: end },
    endAt: { $gt: start }
  };

  if (query.eventType) filter.eventType = query.eventType;
  if (query.source) filter.source = query.source;

  const events = await PlannerEvent.find(filter).sort({ startAt: 1 }).lean();
  return events.map(formatPlannerEvent);
}

export async function getTodayEvents(owner, timezone) {
  const { start, end } = startEndOfToday(timezone || PLANNER_DEFAULT_TIMEZONE);

  await reconcileBookingsForOwner(owner, { from: start, to: end });

  const events = await PlannerEvent.find({
    ...buildOwnerFilter(owner),
    isCancelled: false,
    startAt: { $lt: end },
    endAt: { $gt: start }
  })
    .sort({ startAt: 1 })
    .lean();

  return events.map(formatPlannerEvent);
}

export async function getEventById(eventId, owner) {
  const event = await getOwnedEvent(eventId, owner);
  return formatPlannerEvent(event);
}

export async function updateEvent(eventId, owner, payload) {
  const event = await getOwnedEvent(eventId, owner);
  const patch = filterPlatformPatchPayload(payload, event);

  if (patch.startAt !== undefined || patch.endAt !== undefined) {
    const start = patch.startAt !== undefined ? patch.startAt : event.startAt;
    const end = patch.endAt !== undefined ? patch.endAt : event.endAt;
    const tz = patch.timezone || event.timezone || PLANNER_DEFAULT_TIMEZONE;
    const range = assertValidRange(start, end, tz);
    patch.startAt = range.start;
    patch.endAt = range.end;
  }

  if (patch.title !== undefined) patch.title = patch.title.trim();
  if (patch.caseRef !== undefined) patch.caseRef = patch.caseRef.trim();
  if (patch.location !== undefined) patch.location = patch.location.trim();
  if (patch.eventType !== undefined) {
    patch.color = resolveEventColor(patch.eventType);
  }

  Object.assign(event, patch);
  await event.save();
  return formatPlannerEvent(event);
}

export async function deleteEvent(eventId, owner) {
  const event = await getOwnedEvent(eventId, owner);
  assertManualEventEditable(event);
  await PlannerEvent.deleteOne({ _id: event._id });
  return { id: event._id };
}

export async function findConflicts(owner, { startAt, endAt, excludeEventId = null }) {
  const { start, end } = assertValidRange(startAt, endAt);

  await reconcileBookingsForOwner(owner, { from: start, to: end });

  const filter = buildOverlapFilter({ owner, startAt: start, endAt: end, excludeEventId });
  const conflicts = await PlannerEvent.find(filter).sort({ startAt: 1 }).lean();
  return conflicts.map(formatPlannerEvent);
}
