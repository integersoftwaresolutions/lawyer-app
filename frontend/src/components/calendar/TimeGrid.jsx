import { useEffect, useRef } from "react";
import { HOUR_START, HOUR_END, HOUR_HEIGHT, getEventColorStyles } from "../../constants/calendar.constants";
import {
  dateAtHour,
  eventOverlapsDay,
  formatHourLabel,
  formatTime,
  getGridHourCount
} from "../../utils/calendar/dateUtils";
import { layoutTimedEvents } from "../../utils/calendar/eventLayout";

const HOURS = Array.from({ length: getGridHourCount(HOUR_START, HOUR_END) }, (_, i) => HOUR_START + i);
const GRID_HEIGHT = HOURS.length * HOUR_HEIGHT;

function HourGutter() {
  return (
    <div className="border-r border-border shrink-0" style={{ width: 52 }}>
      {HOURS.map((h) => (
        <div
          key={h}
          className="relative box-border border-b border-border/60"
          style={{ height: HOUR_HEIGHT }}
        >
          <span className="absolute top-0 left-0 right-2 -translate-y-1/2 text-[10px] text-text-muted text-right leading-none pointer-events-none">
            {formatHourLabel(h)}
          </span>
        </div>
      ))}
    </div>
  );
}

function TimedEventBlock({ layout, timezone, onSelectEvent, compact = false }) {
  const { event, top, height, column, columnCount } = layout;
  const styles = getEventColorStyles(event);
  const widthPct = 100 / columnCount;
  const leftPct = column * widthPct;

  return (
    <button
      type="button"
      onClick={() => onSelectEvent?.(event)}
      className={`absolute rounded-md text-left text-white shadow-sm border-l-[3px] overflow-hidden z-10 hover:brightness-110 transition-[filter] ${styles.block} ${
        compact ? "px-1 py-0.5 text-[10px]" : "px-2 py-1.5 text-xs"
      }`}
      style={{
        top,
        height,
        left: `calc(${leftPct}% + 2px)`,
        width: `calc(${widthPct}% - 4px)`
      }}
    >
      <div className={`font-semibold truncate ${compact ? "text-[10px]" : "text-xs"}`}>{event.title}</div>
      {!compact && height >= 36 && (
        <div className="opacity-90 truncate text-[10px] mt-0.5">
          {formatTime(event.startAt, timezone)} – {formatTime(event.endAt, timezone)}
        </div>
      )}
    </button>
  );
}

function DayColumn({ dateKey, events, timezone, onSelectEvent, onSlotClick, compact, showBorder = false }) {
  const layouts = layoutTimedEvents(events, dateKey, {
    timezone,
    hourStart: HOUR_START,
    hourEnd: HOUR_END,
    hourHeight: HOUR_HEIGHT,
    minHeightPx: compact ? 20 : 28
  });

  return (
    <div className={`relative flex-1 min-w-0 ${showBorder ? "border-l border-border" : ""}`}>
      {HOURS.map((h) => (
        <div
          key={h}
          className="box-border border-b border-border/60 hover:bg-primary/5 cursor-pointer"
          style={{ height: HOUR_HEIGHT }}
          onClick={() => {
            const start = dateAtHour(dateKey, h, timezone);
            const end = new Date(start.getTime() + 60 * 60 * 1000);
            onSlotClick?.({ dateKey, startAt: start.toISOString(), endAt: end.toISOString() });
          }}
        />
      ))}

      {layouts.map((layout) => (
        <TimedEventBlock
          key={`${layout.event.id}-${dateKey}`}
          layout={layout}
          timezone={timezone}
          onSelectEvent={onSelectEvent}
          compact={compact}
        />
      ))}
    </div>
  );
}

export function TimeGridBody({
  dateKey,
  events,
  timezone,
  onSelectEvent,
  onSlotClick,
  compact = false,
  scrollToHour = null
}) {
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || scrollToHour == null) return;
    const clamped = Math.max(HOUR_START, Math.min(scrollToHour, HOUR_END));
    el.scrollTop = Math.max(0, (clamped - HOUR_START) * HOUR_HEIGHT - HOUR_HEIGHT);
  }, [dateKey, scrollToHour]);

  return (
    <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
      <div className="flex" style={{ minHeight: GRID_HEIGHT }}>
        <HourGutter />
        <DayColumn
          dateKey={dateKey}
          events={events}
          timezone={timezone}
          onSelectEvent={onSelectEvent}
          onSlotClick={onSlotClick}
          compact={compact}
        />
      </div>
    </div>
  );
}

export function WeekTimeGridBody({
  dateKeys,
  events,
  timezone,
  onSelectEvent,
  onSlotClick,
  scrollToHour = null
}) {
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || scrollToHour == null) return;
    const clamped = Math.max(HOUR_START, Math.min(scrollToHour, HOUR_END));
    el.scrollTop = Math.max(0, (clamped - HOUR_START) * HOUR_HEIGHT - HOUR_HEIGHT);
  }, [dateKeys.join(","), scrollToHour]);

  return (
    <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
      <div className="flex" style={{ minHeight: GRID_HEIGHT }}>
        <HourGutter />
        <div
          className="grid flex-1 min-w-0"
          style={{ gridTemplateColumns: `repeat(${dateKeys.length}, minmax(0, 1fr))` }}
        >
          {dateKeys.map((dateKey) => (
            <DayColumn
              key={dateKey}
              dateKey={dateKey}
              events={events.filter((ev) => eventOverlapsDay(ev, dateKey, timezone))}
              timezone={timezone}
              onSelectEvent={onSelectEvent}
              onSlotClick={onSlotClick}
              compact
              showBorder
            />
          ))}
        </div>
      </div>
    </div>
  );
}
