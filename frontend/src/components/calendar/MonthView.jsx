import EventChip from "./EventChip";
import {
  getMonthGrid,
  formatDayNumber,
  isToday,
  toDateKey
} from "../../utils/calendar/dateUtils";
import { DEFAULT_TIMEZONE } from "../../constants/calendar.constants";

const WEEK_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_VISIBLE = 2;

function parseDateKeySafe(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

export default function MonthView({
  anchorDate,
  eventsByDate,
  timezone = DEFAULT_TIMEZONE,
  onSelectEvent,
  onSelectDay,
  onCreateOnDay
}) {
  const weeks = getMonthGrid(anchorDate, timezone);
  const anchorMonthPrefix = toDateKey(anchorDate, timezone).slice(0, 7);

  return (
    <div className="flex flex-col min-h-0 flex-1 border border-border rounded-xl overflow-hidden bg-card">
      <div className="grid grid-cols-7 border-b border-border bg-surface shrink-0">
        {WEEK_HEADERS.map((h) => (
          <div
            key={h}
            className="py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-text-muted"
          >
            {h}
          </div>
        ))}
      </div>

      <div
        className="flex-1 min-h-0 grid divide-y divide-border overflow-hidden"
        style={{ gridTemplateRows: "repeat(6, minmax(5.5rem, 1fr))" }}
      >
        {weeks.slice(0, 6).map((week, wi) => (
          <div
            key={wi}
            className="grid grid-cols-7 divide-x divide-border min-h-0 h-full overflow-hidden"
          >
            {week.map((dateKey) => {
              const dayEvents = eventsByDate[dateKey] || [];
              const visible = dayEvents.slice(0, MAX_VISIBLE);
              const overflow = dayEvents.length - MAX_VISIBLE;
              const dayNum = formatDayNumber(dateKey);
              const inMonth = dateKey.slice(0, 7) === anchorMonthPrefix;
              const today = isToday(parseDateKeySafe(dateKey), timezone);

              return (
                <div
                  key={dateKey}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectDay?.(dateKey)}
                  onKeyDown={(e) => e.key === "Enter" && onSelectDay?.(dateKey)}
                  className={`group h-full min-h-0 min-w-0 overflow-hidden p-1.5 sm:p-2 flex gap-1.5 sm:gap-2 cursor-pointer hover:bg-surface-hover transition-colors ${
                    !inMonth ? "bg-surface" : ""
                  }`}
                >
                  <div className="shrink-0 flex flex-col items-center gap-1 pt-0.5 self-stretch">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 text-xs sm:text-sm font-semibold rounded-full ${
                        today
                          ? "bg-primary text-primary-text"
                          : inMonth
                            ? "text-text-primary"
                            : "text-text-muted"
                      }`}
                    >
                      {dayNum}
                    </span>
                    {onCreateOnDay && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCreateOnDay(dateKey);
                        }}
                        className="flex items-center justify-center w-5 h-5 rounded-md text-text-muted hover:text-primary hover:bg-surface-hover opacity-0 group-hover:opacity-100 transition-opacity text-sm leading-none"
                        title="Add event"
                      >
                        +
                      </button>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 min-h-0 flex flex-col gap-1 justify-start">
                    {visible.length > 0 && (
                      <div className="flex flex-col gap-1">
                        {visible.map((ev) => (
                          <EventChip
                            key={ev.id}
                            event={ev}
                            titleOnly
                            onClick={onSelectEvent}
                            className="shrink-0 h-[1.125rem] flex items-center"
                          />
                        ))}
                      </div>
                    )}
                    {overflow > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDay?.(dateKey);
                        }}
                        className="shrink-0 text-[10px] font-medium text-text-muted hover:text-primary text-left truncate"
                      >
                        +{overflow} more
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
