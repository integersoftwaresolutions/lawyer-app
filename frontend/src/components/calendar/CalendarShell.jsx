import { useEffect, useState } from "react";
import { CALENDAR_VIEWS, DEFAULT_TIMEZONE } from "../../constants/calendar.constants";
import { useCalendar } from "../../hooks/useCalendar";
import CalendarToolbar from "./CalendarToolbar";
import CalendarLegend from "./CalendarLegend";
import MonthView from "./MonthView";
import WeekView from "./WeekView";
import DayView from "./DayView";
import DayEventsPanel from "./DayEventsPanel";
import EventDetailPanel from "./EventDetailPanel";
import EventFormModal from "./EventFormModal";
import { ConfirmModal, Spinner } from "../ui";
import VerificationRequiredPanel from "../verification/VerificationRequiredPanel";
import { isLawyerNotVerifiedError } from "../../utils/lawyerVerification";

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
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    cal.clearSelection();
  }, [cal.view]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleDeleteRequest = (event) => {
    setDeleteTarget(event);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await cal.deleteEvent(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleDaySelect = (dateKey) => {
    cal.selectDay(dateKey);
  };

  const handleEventSelect = (event) => {
    cal.selectDayEvent(event);
  };

  const editingEvent = cal.formOpen && cal.selectedEvent && !cal.formDefaults ? cal.selectedEvent : null;
  const showSidePanel = !cal.formOpen && (cal.selectedEvent || cal.selectedDayKey);
  const dayEvents = cal.selectedDayKey ? cal.eventsByDate[cal.selectedDayKey] || [] : [];

  if (!cal.loading && isLawyerNotVerifiedError(cal.error)) {
    return (
      <div className={className}>
        <VerificationRequiredPanel compact />
      </div>
    );
  }

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
        <div className="shrink-0 px-3 py-2 rounded-lg bg-danger-light border border-danger-light text-sm text-danger">
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
              onSelectEvent={handleEventSelect}
              onSelectDay={handleDaySelect}
              onCreateOnDay={allowCreate ? handleCreateOnDay : undefined}
            />
          )}

          {cal.view === CALENDAR_VIEWS.WEEK && (
            <WeekView
              anchorDate={cal.anchorDate}
              events={cal.events}
              timezone={timezone}
              onSelectEvent={handleEventSelect}
              onSelectDay={handleDaySelect}
              onSlotClick={allowCreate ? handleSlotClick : undefined}
            />
          )}

          {cal.view === CALENDAR_VIEWS.DAY && (
            <DayView
              anchorDate={cal.anchorDate}
              events={cal.events}
              timezone={timezone}
              onSelectEvent={handleEventSelect}
              onSelectDay={handleDaySelect}
              onSlotClick={allowCreate ? handleSlotClick : undefined}
            />
          )}
        </div>

        {showSidePanel &&
          (cal.selectedEvent ? (
            <EventDetailPanel
              event={cal.selectedEvent}
              timezone={timezone}
              onBack={cal.backToDayList}
              onClose={cal.clearSelection}
              onEdit={(ev) => cal.openEdit(ev)}
              onDelete={handleDeleteRequest}
              deleting={cal.saving}
            />
          ) : (
            <DayEventsPanel
              dateKey={cal.selectedDayKey}
              events={dayEvents}
              timezone={timezone}
              onSelectEvent={cal.selectEvent}
              onClose={cal.clearSelection}
              onCreateEvent={
                allowCreate && cal.selectedDayKey
                  ? () => handleCreateOnDay(cal.selectedDayKey)
                  : undefined
              }
            />
          ))}
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

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete event"
        message={
          deleteTarget
            ? `Delete "${deleteTarget.title}"? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        loading={cal.saving}
      />
    </div>
  );
}
