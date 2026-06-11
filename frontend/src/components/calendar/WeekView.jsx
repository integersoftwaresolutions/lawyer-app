import { getEventColorStyles } from "../../constants/calendar.constants";
import {
  HOUR_START,
  HOUR_END,
  HOUR_HEIGHT,
  DEFAULT_TIMEZONE
} from "../../constants/calendar.constants";
import {
  getWeekDateKeys,
  getWeekdayLabel,
  formatDayNumber,
  isToday,
  eventOverlapsDay,
  clampEventToDay,
  minutesFromMidnight,
  formatTime
} from "../../utils/calendar/dateUtils";

const HOURS = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);

function parseDateKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

export default function WeekView({
  anchorDate,
  events,
  timezone = DEFAULT_TIMEZONE,
  onSelectEvent,
  onSlotClick
}) {
  const dateKeys = getWeekDateKeys(anchorDate, timezone);

  return (
    <div className="flex flex-col min-h-0 flex-1 border border-border rounded-xl overflow-hidden bg-card">
      <div className="grid grid-cols-[52px_repeat(7,1fr)] border-b border-border bg-surface/50 shrink-0">
        <div />
        {dateKeys.map((key) => {
          const today = isToday(parseDateKey(key), timezone);
          return (
            <div key={key} className="py-2 text-center border-l border-border">
              <div className="text-[10px] uppercase text-text-muted font-medium">
                {getWeekdayLabel(key)}
              </div>
              <div
                className={`inline-flex items-center justify-center w-8 h-8 mt-0.5 text-sm font-semibold rounded-full ${
                  today ? "bg-primary text-primary-text" : "text-text-primary"
                }`}
              >
                {formatDayNumber(key)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div
          className="grid grid-cols-[52px_repeat(7,1fr)] relative"
          style={{ minHeight: HOURS.length * HOUR_HEIGHT }}
        >
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

          {dateKeys.map((dateKey) => (
            <DayColumn
              key={dateKey}
              dateKey={dateKey}
              events={events.filter((ev) => eventOverlapsDay(ev, dateKey, timezone))}
              timezone={timezone}
              onSelectEvent={onSelectEvent}
              onSlotClick={onSlotClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function DayColumn({ dateKey, events, timezone, onSelectEvent, onSlotClick }) {
  const totalMinutes = (HOUR_END - HOUR_START) * 60;

  return (
    <div className="relative border-l border-border">
      {HOURS.map((h) => (
        <div
          key={h}
          className="border-b border-border/60 hover:bg-primary/5 cursor-pointer transition-colors"
          style={{ height: HOUR_HEIGHT }}
          onClick={() => {
            const start = new Date(`${dateKey}T${String(h).padStart(2, "0")}:00:00+05:00`);
            const end = new Date(start.getTime() + 60 * 60 * 1000);
            onSlotClick?.({ dateKey, startAt: start.toISOString(), endAt: end.toISOString() });
          }}
        />
      ))}

      {events.map((ev) => {
        const { start, end } = clampEventToDay(ev, dateKey, timezone);
        const topMin = Math.max(0, minutesFromMidnight(start, timezone) - HOUR_START * 60);
        const endMin = Math.min(totalMinutes, minutesFromMidnight(end, timezone) - HOUR_START * 60);
        const heightMin = Math.max(24, endMin - topMin);
        const styles = getEventColorStyles(ev);
        const top = (topMin / 60) * HOUR_HEIGHT;
        const height = (heightMin / 60) * HOUR_HEIGHT;

        return (
          <button
            key={`${ev.id}-${dateKey}`}
            type="button"
            onClick={() => onSelectEvent?.(ev)}
            className={`absolute left-0.5 right-0.5 rounded-md px-1.5 py-1 text-left text-white text-xs shadow-sm border-l-[3px] overflow-hidden z-10 ${styles.block}`}
            style={{ top, height: Math.max(height, 22) }}
          >
            <div className="font-semibold truncate">{ev.title}</div>
            <div className="opacity-90 truncate text-[10px]">
              {formatTime(ev.startAt, timezone)} – {formatTime(ev.endAt, timezone)}
            </div>
          </button>
        );
      })}
    </div>
  );
}
