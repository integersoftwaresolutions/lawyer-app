import { ApiError } from "../../helpers/apiError.js";
import PlannerEvent from "../../models/PlannerEvent.js";
import Booking from "../../models/Booking.js";
import User from "../../models/User.js";
import {
  PLANNER_EVENT_TYPES,
  PLANNER_EVENT_SOURCES,
  PLANNER_DEFAULT_TIMEZONE
} from "../../config/planner.config.js";
import {
  BOOKING_STATUS,
  CALENDAR_OWNER_ROLES,
  CONSULTATION_TYPE
} from "../../config/constants.js";
import { formatPlannerEvent, resolveEventColor } from "./planner.helpers.js";

const CONSULTATION_LABELS = {
  [CONSULTATION_TYPE.CHAT]: "Chat",
  [CONSULTATION_TYPE.VIDEO]: "Video",
  [CONSULTATION_TYPE.CHAT_VIDEO]: "Chat + Video"
};

export async function resolveClientDisplay(booking) {
  const populated = booking.clientId?.email ? booking.clientId : null;
  if (populated) {
    return { clientEmail: populated.email, clientName: "" };
  }

  const clientId = booking.clientId?._id || booking.clientId;
  if (!clientId) return { clientEmail: "", clientName: "" };

  const user = await User.findById(clientId).select("email").lean();
  return { clientEmail: user?.email || "", clientName: "" };
}

function buildBookingTitle(booking, displayName) {
  const typeLabel = CONSULTATION_LABELS[booking.consultationType] || "Consultation";
  return `${typeLabel} – ${displayName}`;
}

export async function syncFromBooking(booking, { clientEmail = "", clientName = "", titleOverride = null } = {}) {
  if (!booking?._id || !booking.lawyerUserId) {
    throw new ApiError(400, "Invalid booking for planner sync");
  }

  const startAt = new Date(booking.startAt);
  const endAt = new Date(startAt.getTime() + (booking.durationMinutes || 30) * 60 * 1000);
  const displayName = clientName || clientEmail || "Client";

  const doc = {
    ownerId: booking.lawyerUserId,
    ownerRole: CALENDAR_OWNER_ROLES.LAWYER,
    title: titleOverride || `Consultation – ${displayName}`,
    eventType: PLANNER_EVENT_TYPES.PLATFORM_BOOKING,
    startAt,
    endAt,
    timezone: PLANNER_DEFAULT_TIMEZONE,
    source: PLANNER_EVENT_SOURCES.BOOKING,
    bookingId: booking._id,
    clientName: displayName,
    consultationType: booking.consultationType || "CHAT",
    color: resolveEventColor(PLANNER_EVENT_TYPES.PLATFORM_BOOKING),
    isCancelled: false,
    metadata: {
      bookingStatus: booking.status,
      amount: booking.amount,
      clientId: booking.clientId?.toString?.() || booking.clientId
    }
  };

  const event = await PlannerEvent.findOneAndUpdate(
    { bookingId: booking._id },
    { $set: doc },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return formatPlannerEvent(event);
}

export async function cancelFromBooking(bookingId) {
  if (!bookingId) return null;
  const event = await PlannerEvent.findOneAndUpdate(
    { bookingId },
    { $set: { isCancelled: true } },
    { new: true }
  );
  return event ? formatPlannerEvent(event) : null;
}

/** Upsert or remove a planner event for a booking. Non-throwing — booking flows must not fail. */
export async function syncBookingToPlanner(booking) {
  if (!booking?._id || !booking.lawyerUserId) return null;

  try {
    if (booking.deletedByClient || booking.deletedByLawyer || booking.status === BOOKING_STATUS.CANCELLED) {
      await cancelFromBooking(booking._id);
      return null;
    }

    if (![BOOKING_STATUS.BOOKED, BOOKING_STATUS.ACTIVE, BOOKING_STATUS.COMPLETED].includes(booking.status)) {
      await cancelFromBooking(booking._id);
      return null;
    }

    const client = await resolveClientDisplay(booking);
    const displayName = client.clientName || client.clientEmail || "Client";
    return syncFromBooking(booking, {
      ...client,
      titleOverride: buildBookingTitle(booking, displayName)
    });
  } catch (err) {
    console.error("[planner] syncBookingToPlanner failed:", err.message);
    return null;
  }
}

/** Ensures planner events exist for bookings in the requested window. */
export async function reconcileBookingsForOwner(owner, { from, to }) {
  if (owner.ownerRole !== CALENDAR_OWNER_ROLES.LAWYER) return;

  const fromDate = new Date(from);
  const toDate = new Date(to);

  try {
    const bookings = await Booking.find({
      lawyerUserId: owner.ownerId,
      deletedByClient: { $ne: true },
      deletedByLawyer: { $ne: true },
      status: { $in: [BOOKING_STATUS.BOOKED, BOOKING_STATUS.ACTIVE, BOOKING_STATUS.COMPLETED] }
    })
      .populate("clientId", "email")
      .lean();

    for (const booking of bookings) {
      const startAt = new Date(booking.startAt);
      const endAt = new Date(startAt.getTime() + (booking.durationMinutes || 30) * 60 * 1000);
      if (startAt >= toDate || endAt <= fromDate) continue;
      await syncBookingToPlanner(booking);
    }
  } catch (err) {
    console.error("[planner] reconcileBookingsForOwner failed:", err.message);
  }
}
