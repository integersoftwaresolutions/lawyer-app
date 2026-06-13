import { EVENT_TYPE_LABELS, getEventColorStyles } from "../../constants/calendar.constants";
import { formatTime } from "../../utils/calendar/dateUtils";

export default function EventChip({
  event,
  onClick,
  compact = false,
  titleOnly = false,
  className = ""
}) {
  const styles = getEventColorStyles(event);
  const label = EVENT_TYPE_LABELS[event.eventType] || event.eventType;

  if (titleOnly) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(event);
        }}
        title={`${event.title} · ${label}`}
        className={`w-full min-w-0 text-left rounded px-1.5 py-0.5 truncate transition-opacity hover:opacity-90 border-l-2 text-[10px] sm:text-[11px] font-medium leading-snug ${styles.chip} ${className}`}
      >
        {event.title}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(event);
      }}
      title={`${event.title} (${label})`}
      className={`w-full text-left rounded-md border px-1.5 py-0.5 truncate transition-opacity hover:opacity-90 ${styles.chip} ${
        compact ? "text-[10px] leading-tight" : "text-xs"
      } ${className}`}
    >
      {!compact && (
        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle ${styles.dot}`} />
      )}
      <span className="font-medium">{formatTime(event.startAt)}</span>
      <span className="mx-1 opacity-60">·</span>
      <span>{event.title}</span>
    </button>
  );
}
