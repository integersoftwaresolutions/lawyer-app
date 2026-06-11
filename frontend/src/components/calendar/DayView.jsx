import { getEventColorStyles } from "../../constants/calendar.constants";
import {
  HOUR_START,
  HOUR_END,
  HOUR_HEIGHT,
  DEFAULT_TIMEZONE
} from "../../constants/calendar.constants";
import {
  toDateKey,
  eventOverlapsDay,
  clampEventToDay,
  minutesFromMidnight,
  formatTime,
  formatDayTitle
} from "../../utils/calendar/dateUtils";

const HOURS = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);

export default function DayView({
  anchorDate,
  events,
  timezone = DEFAULT_TIMEZONE,
  onSelectEvent,
  onSlotClick
}) {
  const dateKey = toDateKey(anchorDate, timezone);
  const dayEvents = events.filter((ev) => eventOverlapsDay(ev, dateKey, timezone));
  const totalMinutes = (HOUR_END - HOUR_START) * 60;

  return (
    <div className="flex flex-col min-h-0 flex-1 border border-border rounded-xl overflow-hidden bg-card">
      <div className="px-4 py-3 border-b border-border bg-surface/50 shrink-0">
        <p className="text-sm font-semibold text-text-primary">{formatDayTitle(anchorDate, timezone)}</p>
        <p className="text-xs text-text-muted mt-0.5">
          {dayEvents.length} event{dayEvents.length !== 1 ? "s" : ""} · PKT
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="grid grid-cols-[52px_1fr] relative" style={{ minHeight: HOURS.length * HOUR_HEIGHT }}>
          <div className="border-r border-border">
            {HOURS.map((h) => (
              <div
                key={h}
                className="text-[10px] text-text-muted pr-2 text-right -mt-2"
                style={{ height: HOUR_HEIGHT }}
              >
                {h === 12 ? "12 PM" : h > 12 ? `${h - 12} PM` : `${h} AM`}
              </div>
            ))}
          </div>

          <div className="relative">
            {HOURS.map((h) => (
              <div
                key={h}
                className="border-b border-border/60 hover:bg-primary/5 cursor-pointer"
                style={{ height: HOUR_HEIGHT }}
                onClick={() => {
                  const start = new Date(`${dateKey}T${String(h).padStart(2, "0")}:00:00+05:00`);
                  const end = new Date(start.getTime() + 60 * 60 * 1000);
                  onSlotClick?.({ dateKey, startAt: start.toISOString(), endAt: end.toISOString() });
                }}
              />
            ))}

            {dayEvents.map((ev) => {
              const { start, end } = clampEventToDay(ev, dateKey, timezone);
              const topMin = Math.max(0, minutesFromMidnight(start, timezone) - HOUR_START * 60);
              const endMin = Math.min(totalMinutes, minutesFromMidnight(end, timezone) - HOUR_START * 60);
              const heightMin = Math.max(30, endMin - topMin);
              const styles = getEventColorStyles(ev);
              const top = (topMin / 60) * HOUR_HEIGHT;
              const height = (heightMin / 60) * HOUR_HEIGHT;

              return (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => onSelectEvent?.(ev)}
                  className={`absolute left-2 right-4 rounded-lg px-3 py-2 text-left text-white shadow-md border-l-4 z-10 ${styles.block}`}
                  style={{ top, height: Math.max(height, 36) }}
                >
                  <div className="font-semibold text-sm truncate">{ev.title}</div>
                  <div className="text-xs opacity-90 mt-0.5">
                    {formatTime(ev.startAt, timezone)} – {formatTime(ev.endAt, timezone)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
