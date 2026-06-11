import { CALENDAR_VIEWS, DEFAULT_TIMEZONE } from "../../constants/calendar.constants";
import { useCalendar } from "../../hooks/useCalendar";
import { parseDateKey } from "../../utils/calendar/dateUtils";
import CalendarToolbar from "./CalendarToolbar";
import CalendarLegend from "./CalendarLegend";
import MonthView from "./MonthView";
import WeekView from "./WeekView";
import DayView from "./DayView";
import EventDetailPanel from "./EventDetailPanel";
import EventFormModal from "./EventFormModal";
import { Spinner } from "../ui";

/**
 * Reusable calendar shell — pass any calendar API adapter (lawyer or future client).
 *
 * @example
 * <CalendarShell api={plannerApi} title="Smart Planner" />
 */
export default function CalendarShell({
  api,
  timezone = DEFAULT_TIMEZONE,
  title = "Calendar",
  subtitle,
  allowCreate = true,
  className = ""
}) {
  const cal = useCalendar({ api, timezone });

  const handleSelectDay = (dateKey) => {
    cal.setAnchorDate(parseDateKey(dateKey));
    cal.setView(CALENDAR_VIEWS.DAY);
  };

  const handleCreateOnDay = (dateKey) => {
    const start = new Date(`${dateKey}T09:00:00+05:00`);
    const end = new Date(`${dateKey}T10:00:00+05:00`);
    cal.openCreate({ startAt: start.toISOString(), endAt: end.toISOString() });
  };

  const handleSlotClick = ({ startAt, endAt }) => {
    cal.openCreate({ startAt, endAt });
  };

  const handleFormSubmit = async (payload, eventId) => {
    if (eventId) {
      await cal.updateEvent(eventId, payload);
    } else {
      await cal.createEvent(payload);
    }
    cal.closeForm();
  };

  const handleDelete = async (event) => {
    if (!window.confirm(`Delete "${event.title}"?`)) return;
    await cal.deleteEvent(event.id);
  };

  const editingEvent = cal.formOpen && cal.selectedEvent && !cal.formDefaults ? cal.selectedEvent : null;

  return (
    <div className={`flex flex-col h-full min-h-0 gap-3 ${className}`}>
      {(title || subtitle) && (
        <div className="shrink-0">
          {title && (
            <h1 className="text-base sm:text-lg font-bold text-text-primary leading-tight">{title}</h1>
          )}
          {subtitle && (
            <p className="text-[11px] sm:text-xs text-text-muted mt-0.5">{subtitle}</p>
          )}
        </div>
      )}

      <CalendarToolbar
        view={cal.view}
        onViewChange={cal.setView}
        anchorDate={cal.anchorDate}
        onPrev={cal.goPrev}
        onNext={cal.goNext}
        onToday={cal.goToday}
        onCreate={() => cal.openCreate()}
        allowCreate={allowCreate}
        timezone={timezone}
      />

      <CalendarLegend className="shrink-0 hidden sm:flex" />

      {cal.error && (
        <div className="shrink-0 px-3 py-2 rounded-lg bg-danger/10 border border-danger/20 text-sm text-danger">
          {cal.error}
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-3">
        <div className="flex-1 min-h-0 flex flex-col relative">
          {cal.loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-card/60 backdrop-blur-[1px] rounded-xl">
              <Spinner className="w-8 h-8 text-primary" />
            </div>
          )}

          {cal.view === CALENDAR_VIEWS.MONTH && (
            <MonthView
              anchorDate={cal.anchorDate}
              eventsByDate={cal.eventsByDate}
              timezone={timezone}
              onSelectEvent={(ev) => {
                cal.selectEvent(ev);
              }}
              onSelectDay={handleSelectDay}
              onCreateOnDay={allowCreate ? handleCreateOnDay : undefined}
            />
          )}

          {cal.view === CALENDAR_VIEWS.WEEK && (
            <WeekView
              anchorDate={cal.anchorDate}
              events={cal.events}
              timezone={timezone}
              onSelectEvent={(ev) => cal.selectEvent(ev)}
              onSlotClick={allowCreate ? handleSlotClick : undefined}
            />
          )}

          {cal.view === CALENDAR_VIEWS.DAY && (
            <DayView
              anchorDate={cal.anchorDate}
              events={cal.events}
              timezone={timezone}
              onSelectEvent={(ev) => cal.selectEvent(ev)}
              onSlotClick={allowCreate ? handleSlotClick : undefined}
            />
          )}
        </div>

        {cal.selectedEvent && !cal.formOpen && (
          <EventDetailPanel
            event={cal.selectedEvent}
            timezone={timezone}
            onClose={cal.clearSelection}
            onEdit={(ev) => cal.openEdit(ev)}
            onDelete={handleDelete}
            deleting={cal.saving}
          />
        )}
      </div>

      <EventFormModal
        isOpen={cal.formOpen}
        onClose={cal.closeForm}
        event={editingEvent}
        defaults={cal.formDefaults}
        timezone={timezone}
        onSubmit={handleFormSubmit}
        onCheckConflicts={cal.checkConflicts}
        conflicts={cal.conflicts}
        saving={cal.saving}
      />
    </div>
  );
}
