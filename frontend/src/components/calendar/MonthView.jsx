import EventChip from "./EventChip";
import {
  getMonthGrid,
  formatDayNumber,
  isToday,
  toDateKey
} from "../../utils/calendar/dateUtils";
import { DEFAULT_TIMEZONE } from "../../constants/calendar.constants";

const WEEK_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_VISIBLE = 3;

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
      <div className="grid grid-cols-7 border-b border-border bg-surface/50">
        {WEEK_HEADERS.map((h) => (
          <div
            key={h}
            className="py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-text-muted"
          >
            {h}
          </div>
        ))}
      </div>

      <div className="flex-1 min-h-0 grid grid-rows-6 divide-y divide-border">
        {weeks.slice(0, 6).map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 divide-x divide-border min-h-[88px] sm:min-h-[100px]">
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
                  className={`group p-1 sm:p-1.5 flex flex-col gap-0.5 cursor-pointer hover:bg-surface-hover/80 transition-colors ${
                    !inMonth ? "bg-surface/30" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 text-xs sm:text-sm font-medium rounded-full ${
                        today
                          ? "bg-primary text-primary-text"
                          : inMonth
                            ? "text-text-primary"
                            : "text-text-muted"
                      }`}
                    >
                      {dayNum}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreateOnDay?.(dateKey);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-primary text-lg leading-none px-1 hidden sm:block"
                      title="Add event"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    {visible.map((ev) => (
                      <EventChip key={ev.id} event={ev} compact onClick={onSelectEvent} />
                    ))}
                    {overflow > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDay?.(dateKey);
                        }}
                        className="text-[10px] text-text-muted hover:text-primary text-left pl-1"
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
