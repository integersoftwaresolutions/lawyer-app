import { DEFAULT_TIMEZONE } from "../../constants/calendar.constants.js";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function partsInTz(date, timeZone = DEFAULT_TIMEZONE) {
  const d = date instanceof Date ? date : new Date(date);
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
  const parts = fmt.formatToParts(d);
  const get = (type) => parts.find((p) => p.type === type)?.value;
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    second: Number(get("second"))
  };
}

/** Calendar date key YYYY-MM-DD in timezone. */
export function toDateKey(date, timeZone = DEFAULT_TIMEZONE) {
  const p = partsInTz(date, timeZone);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

export function parseDateKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

export function addDays(date, n) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

export function addMonths(date, n) {
  const p = partsInTz(date);
  const day = p.day;
  let month = p.month - 1 + n;
  let year = p.year;
  while (month < 0) {
    month += 12;
    year -= 1;
  }
  while (month > 11) {
    month -= 12;
    year += 1;
  }
  const lastDay = daysInMonth(year, month + 1);
  return new Date(Date.UTC(year, month, Math.min(day, lastDay), 12, 0, 0));
}

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Monday-based week start for a date (noon UTC anchor). */
export function startOfWeek(date, timeZone = DEFAULT_TIMEZONE) {
  const key = toDateKey(date, timeZone);
  const anchor = parseDateKey(key);
  const dow = (anchor.getUTCDay() + 6) % 7;
  return addDays(anchor, -dow);
}

export function endOfWeek(date, timeZone = DEFAULT_TIMEZONE) {
  return addDays(startOfWeek(date, timeZone), 6);
}

export function startOfMonth(date, timeZone = DEFAULT_TIMEZONE) {
  const p = partsInTz(date, timeZone);
  return new Date(Date.UTC(p.year, p.month - 1, 1, 12, 0, 0));
}

export function endOfMonth(date, timeZone = DEFAULT_TIMEZONE) {
  const p = partsInTz(date, timeZone);
  const last = daysInMonth(p.year, p.month);
  return new Date(Date.UTC(p.year, p.month - 1, last, 12, 0, 0));
}

/** Month grid: array of weeks, each week is 7 date keys. Includes leading/trailing days. */
export function getMonthGrid(anchorDate, timeZone = DEFAULT_TIMEZONE) {
  const first = startOfMonth(anchorDate, timeZone);
  const last = endOfMonth(anchorDate, timeZone);
  let cursor = startOfWeek(first, timeZone);
  const end = endOfWeek(last, timeZone);
  const weeks = [];

  while (cursor <= end) {
    const week = [];
    for (let i = 0; i < 7; i += 1) {
      week.push(toDateKey(addDays(cursor, i), timeZone));
    }
    weeks.push(week);
    cursor = addDays(cursor, 7);
  }

  return weeks;
}

export function getWeekDateKeys(anchorDate, timeZone = DEFAULT_TIMEZONE) {
  const start = startOfWeek(anchorDate, timeZone);
  return Array.from({ length: 7 }, (_, i) => toDateKey(addDays(start, i), timeZone));
}

export function isSameDateKey(a, b) {
  return toDateKey(a) === toDateKey(b);
}

export function isToday(date, timeZone = DEFAULT_TIMEZONE) {
  return toDateKey(date, timeZone) === toDateKey(new Date(), timeZone);
}

export function formatMonthYear(date, timeZone = DEFAULT_TIMEZONE) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "long",
    year: "numeric"
  }).format(new Date(date));
}

export function formatWeekRange(anchorDate, timeZone = DEFAULT_TIMEZONE) {
  const start = startOfWeek(anchorDate, timeZone);
  const end = endOfWeek(anchorDate, timeZone);
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "numeric",
    year: "numeric"
  });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

export function formatDayTitle(date, timeZone = DEFAULT_TIMEZONE) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(new Date(date));
}

export function formatTime(iso, timeZone = DEFAULT_TIMEZONE) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(new Date(iso));
}

export function formatDateTimeRange(startAt, endAt, timeZone = DEFAULT_TIMEZONE) {
  const sameDay = toDateKey(startAt, timeZone) === toDateKey(endAt, timeZone);
  if (sameDay) {
    return `${formatDayTitle(startAt, timeZone)} · ${formatTime(startAt, timeZone)} – ${formatTime(endAt, timeZone)}`;
  }
  return `${formatTime(startAt, timeZone)} – ${formatTime(endAt, timeZone)}`;
}

export function formatShortDate(iso, timeZone = DEFAULT_TIMEZONE) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "numeric"
  }).format(new Date(iso));
}

export function formatDayNumber(dateKey) {
  return Number(dateKey.split("-")[2]);
}

export function getWeekdayLabel(dateKey) {
  const d = parseDateKey(dateKey);
  const dow = (d.getUTCDay() + 6) % 7;
  return WEEKDAY_LABELS[dow];
}

/** ISO range for API queries covering a calendar view. */
export function getViewRange(view, anchorDate, timeZone = DEFAULT_TIMEZONE) {
  if (view === "day") {
    const key = toDateKey(anchorDate, timeZone);
    const start = new Date(`${key}T00:00:00+05:00`);
    const end = new Date(`${key}T23:59:59.999+05:00`);
    return { from: start.toISOString(), to: end.toISOString() };
  }

  if (view === "week") {
    const startKey = toDateKey(startOfWeek(anchorDate, timeZone), timeZone);
    const endKey = toDateKey(endOfWeek(anchorDate, timeZone), timeZone);
    const start = new Date(`${startKey}T00:00:00+05:00`);
    const end = new Date(`${endKey}T23:59:59.999+05:00`);
    return { from: start.toISOString(), to: end.toISOString() };
  }

  const weeks = getMonthGrid(anchorDate, timeZone);
  const firstKey = weeks[0][0];
  const lastKey = weeks[weeks.length - 1][6];
  const start = new Date(`${firstKey}T00:00:00+05:00`);
  const end = new Date(`${lastKey}T23:59:59.999+05:00`);
  return { from: start.toISOString(), to: end.toISOString() };
}

/** datetime-local input value from ISO (PKT). */
export function toDatetimeLocalValue(iso, timeZone = DEFAULT_TIMEZONE) {
  const p = partsInTz(iso, timeZone);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}T${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}

/** Parse datetime-local as PKT and return ISO. */
export function fromDatetimeLocalValue(value, timeZone = DEFAULT_TIMEZONE) {
  if (!value) return null;
  const [datePart, timePart] = value.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [h, min] = timePart.split(":").map(Number);
  if (timeZone === "Asia/Karachi") {
    const offset = "+05:00";
    return new Date(
      `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:00${offset}`
    ).toISOString();
  }
  return new Date(value).toISOString();
}

/** Minutes from midnight in timezone for positioning in day/week grid. */
export function minutesFromMidnight(iso, timeZone = DEFAULT_TIMEZONE) {
  const p = partsInTz(iso, timeZone);
  return p.hour * 60 + p.minute;
}

export function eventOverlapsDay(event, dateKey, timeZone = DEFAULT_TIMEZONE) {
  const dayStart = new Date(`${dateKey}T00:00:00+05:00`);
  const dayEnd = new Date(`${dateKey}T23:59:59.999+05:00`);
  const start = new Date(event.startAt);
  const end = new Date(event.endAt);
  return start < dayEnd && end > dayStart;
}

export function clampEventToDay(event, dateKey, timeZone = DEFAULT_TIMEZONE) {
  const dayStart = new Date(`${dateKey}T00:00:00+05:00`);
  const dayEnd = new Date(`${dateKey}T23:59:59.999+05:00`);
  const start = new Date(Math.max(new Date(event.startAt).getTime(), dayStart.getTime()));
  const end = new Date(Math.min(new Date(event.endAt).getTime(), dayEnd.getTime()));
  return { start, end };
}
