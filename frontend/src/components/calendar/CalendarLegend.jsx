import { MANUAL_EVENT_TYPES, EVENT_TYPE_LABELS, EVENT_COLOR_STYLES, EVENT_COLOR_TOKENS } from "../../constants/calendar.constants";

export default function CalendarLegend({ className = "" }) {
  const types = [...MANUAL_EVENT_TYPES, "PLATFORM_BOOKING"];

  return (
    <div className={`flex flex-wrap gap-x-4 gap-y-2 ${className}`}>
      {types.map((type) => {
        const token = EVENT_COLOR_TOKENS[type] || "gray";
        const styles = EVENT_COLOR_STYLES[token];
        return (
          <div key={type} className="flex items-center gap-1.5 text-xs text-text-secondary">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${styles.dot}`} />
            <span>{EVENT_TYPE_LABELS[type]}</span>
          </div>
        );
      })}
    </div>
  );
}
