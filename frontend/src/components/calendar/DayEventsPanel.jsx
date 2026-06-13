import { FiPlus, FiX } from "react-icons/fi";
import { Button, IconButton } from "../ui";
import EventChip from "./EventChip";
import { formatDayTitle, parseDateKey } from "../../utils/calendar/dateUtils";

export default function DayEventsPanel({
  dateKey,
  events = [],
  timezone,
  onSelectEvent,
  onClose,
  onCreateEvent
}) {
  const title = formatDayTitle(parseDateKey(dateKey), timezone);

  return (
    <aside className="w-full lg:w-[320px] shrink-0 border border-border rounded-xl bg-card flex flex-col overflow-hidden shadow-sm">
      <div className="flex items-start justify-between gap-2 p-4 border-b border-border shrink-0">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Day schedule</p>
          <h3 className="text-base font-semibold text-text-primary leading-snug mt-0.5">{title}</h3>
          <p className="text-xs text-text-muted mt-1">
            {events.length} event{events.length !== 1 ? "s" : ""}
          </p>
        </div>
        <IconButton icon={FiX} label="Close" size="icon-sm" onClick={onClose} />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-1.5">
        {events.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-8 px-2">No events on this day.</p>
        ) : (
          events.map((event) => (
            <EventChip key={event.id} event={event} onClick={onSelectEvent} />
          ))
        )}
      </div>

      {onCreateEvent && (
        <div className="p-4 border-t border-border shrink-0">
          <Button variant="secondary" size="sm" icon={FiPlus} fullWidth onClick={onCreateEvent}>
            Add event
          </Button>
        </div>
      )}
    </aside>
  );
}
