import { ApiError } from "../helpers/apiError.js";
import Availability from "../models/Availability.js";
import Booking from "../models/Booking.js";
import { BOOKING_STATUS } from "../config/constants.js";

const DEFAULT_SLOTS = [{ start: "09:00", end: "17:00" }];
const SLOT_DURATION_MINUTES = 30;

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

export async function getAvailability(lawyerUserId) {
  let availability = await Availability.findOne({ lawyerUserId });
  
  if (!availability) {
    availability = await Availability.create({
      lawyerUserId,
      monday: { enabled: true, slots: DEFAULT_SLOTS },
      tuesday: { enabled: true, slots: DEFAULT_SLOTS },
      wednesday: { enabled: true, slots: DEFAULT_SLOTS },
      thursday: { enabled: true, slots: DEFAULT_SLOTS },
      friday: { enabled: true, slots: DEFAULT_SLOTS },
      saturday: { enabled: false, slots: [] },
      sunday: { enabled: false, slots: [] }
    });
  }
  
  return availability.toObject();
}

export async function updateAvailability(lawyerUserId, data) {
  let availability = await Availability.findOne({ lawyerUserId });
  
  if (!availability) {
    availability = new Availability({ lawyerUserId });
  }
  
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  
  for (const day of days) {
    if (data[day] !== undefined) {
      availability[day] = data[day];
    }
  }
  
  await availability.save();
  return availability.toObject();
}

// Returns 30-min bookable slots for the given date, excluding any that
// overlap with existing (non-deleted) bookings, and skipping past slots for today.
// Optional excludeBookingId lets the reschedule flow ignore its own current slot.
export async function getAvailableSlots(lawyerUserId, date, excludeBookingId = null) {
  if (!date) return [];

  const availability = await getAvailability(lawyerUserId);
  const dayOfWeek = new Date(date).toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();

  const dayAvailability = availability[dayOfWeek];
  if (!dayAvailability || !dayAvailability.enabled) {
    return [];
  }

  // Build 30-min slot list from lawyer's defined ranges
  const candidateSlots = [];
  for (const range of dayAvailability.slots || []) {
    const startM = parseTimeToMinutes(range.start);
    const endM = parseTimeToMinutes(range.end);
    if (startM === null || endM === null || endM <= startM) continue;

    for (let t = startM; t + SLOT_DURATION_MINUTES <= endM; t += SLOT_DURATION_MINUTES) {
      candidateSlots.push({
        start: minutesToTime(t),
        end: minutesToTime(t + SLOT_DURATION_MINUTES),
        startMinutes: t,
        endMinutes: t + SLOT_DURATION_MINUTES
      });
    }
  }

  if (candidateSlots.length === 0) return [];

  // Filter out past slots for today, and entirely past dates
  const nowDt = new Date();
  const yyyy = nowDt.getFullYear();
  const mm = String(nowDt.getMonth() + 1).padStart(2, "0");
  const dd = String(nowDt.getDate()).padStart(2, "0");
  const todayIso = `${yyyy}-${mm}-${dd}`;
  if (date < todayIso) return [];
  const isToday = date === todayIso;
  const nowMinutes = nowDt.getHours() * 60 + nowDt.getMinutes();

  // Fetch existing bookings on that date that may overlap
  const dayStart = new Date(`${date}T00:00:00`);
  const dayEnd = new Date(`${date}T23:59:59`);
  const bookingQuery = {
    lawyerUserId,
    deletedByClient: { $ne: true },
    deletedByLawyer: { $ne: true },
    status: { $in: [BOOKING_STATUS.BOOKED, BOOKING_STATUS.ACTIVE] },
    startAt: { $gte: dayStart, $lte: dayEnd }
  };
  if (excludeBookingId) {
    bookingQuery._id = { $ne: excludeBookingId };
  }
  const existingBookings = await Booking.find(bookingQuery).lean();

  const bookedRanges = existingBookings.map((b) => {
    const s = new Date(b.startAt);
    const startMin = s.getHours() * 60 + s.getMinutes();
    return { startMin, endMin: startMin + Number(b.durationMinutes || 0) };
  });

  const filtered = candidateSlots.filter((slot) => {
    if (isToday && slot.startMinutes <= nowMinutes) return false;
    const overlapsBooking = bookedRanges.some(
      (b) => slot.startMinutes < b.endMin && slot.endMinutes > b.startMin
    );
    return !overlapsBooking;
  });

  return filtered.map((s) => ({ start: s.start, end: s.end }));
}
