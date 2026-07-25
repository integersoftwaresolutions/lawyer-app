import { DEFAULT_TIMEZONE } from "../../constants/calendar.constants";
import {
  toDateKey,
  eventOverlapsDay,
  formatDayTitle,
  minutesFromMidnight
} from "../../utils/calendar/dateUtils";
import { TimeGridBody } from "./TimeGrid";

export default function DayView({
  anchorDate,
  events,
  timezone = DEFAULT_TIMEZONE,
  onSelectEvent,
  onSelectDay,
  onSlotClick
}) {
  const dateKey = toDateKey(anchorDate, timezone);
  const dayEvents = events.filter((ev) => eventOverlapsDay(ev, dateKey, timezone));
  const scrollToHour = isTodayAnchor(anchorDate, timezone)
    ? minutesFromMidnight(new Date(), timezone) / 60
    : 8;

  return (
    <div className="flex flex-col min-h-0 flex-1 border border-border rounded-xl overflow-hidden bg-card">
      <button
        type="button"
        onClick={() => onSelectDay?.(dateKey)}
        className="w-full text-left px-4 py-3 border-b border-border bg-surface shrink-0 hover:bg-surface-hover transition-colors"
      >
        <p className="text-sm font-semibold text-text-primary">{formatDayTitle(anchorDate, timezone)}</p>
        <p className="text-xs text-text-muted mt-0.5">
          {dayEvents.length} event{dayEvents.length !== 1 ? "s" : ""} · PKT · View all
        </p>
      </button>

      <TimeGridBody
        dateKey={dateKey}
        events={dayEvents}
        timezone={timezone}
        onSelectEvent={onSelectEvent}
        onSlotClick={onSlotClick}
        scrollToHour={scrollToHour}
      />
    </div>
  );
}

function isTodayAnchor(anchorDate, timezone) {
  return toDateKey(anchorDate, timezone) === toDateKey(new Date(), timezone);
}
