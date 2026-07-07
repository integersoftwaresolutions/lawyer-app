import { DEFAULT_TIMEZONE } from "../../constants/calendar.constants";
import {
  getWeekDateKeys,
  getWeekdayLabel,
  formatDayNumber,
  isToday,
  toDateKey,
  minutesFromMidnight,
  parseDateKey
} from "../../utils/calendar/dateUtils";
import { WeekTimeGridBody } from "./TimeGrid";

export default function WeekView({
  anchorDate,
  events,
  timezone = DEFAULT_TIMEZONE,
  onSelectEvent,
  onSelectDay,
  onSlotClick
}) {
  const dateKeys = getWeekDateKeys(anchorDate, timezone);
  const isCurrentWeek = dateKeys.includes(toDateKey(new Date(), timezone));
  const scrollToHour = isCurrentWeek ? minutesFromMidnight(new Date(), timezone) / 60 : 8;

  return (
    <div className="flex flex-col min-h-0 flex-1 border border-border rounded-xl overflow-hidden bg-card">
      <div className="grid grid-cols-[52px_repeat(7,1fr)] border-b border-border bg-surface/50 shrink-0">
        <div />
        {dateKeys.map((key) => {
          const today = isToday(parseDateKey(key), timezone);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDay?.(key)}
              className="py-2 text-center border-l border-border hover:bg-surface-hover/80 transition-colors cursor-pointer"
            >
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
            </button>
          );
        })}
      </div>

      <WeekTimeGridBody
        dateKeys={dateKeys}
        events={events}
        timezone={timezone}
        onSelectEvent={onSelectEvent}
        onSlotClick={onSlotClick}
        scrollToHour={scrollToHour}
      />
    </div>
  );
}
