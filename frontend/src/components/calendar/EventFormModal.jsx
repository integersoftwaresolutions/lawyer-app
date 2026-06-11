import { useEffect, useState } from "react";
import { FiAlertTriangle } from "react-icons/fi";
import { Button, Input, Modal, Select, Textarea, Checkbox } from "../ui";
import {
  MANUAL_EVENT_TYPES,
  EVENT_TYPE_LABELS,
  EVENT_VISIBILITY,
  REMINDER_OPTIONS,
  DEFAULT_TIMEZONE,
  isPlatformEvent
} from "../../constants/calendar.constants";
import { toDatetimeLocalValue, fromDatetimeLocalValue } from "../../utils/calendar/dateUtils";

const EMPTY_FORM = {
  title: "",
  eventType: MANUAL_EVENT_TYPES[0],
  startAt: "",
  endAt: "",
  caseRef: "",
  location: "",
  notes: "",
  reminders: [],
  visibility: EVENT_VISIBILITY.PRIVATE
};

export default function EventFormModal({
  isOpen,
  onClose,
  event = null,
  defaults = null,
  timezone = DEFAULT_TIMEZONE,
  onSubmit,
  onCheckConflicts,
  conflicts = [],
  saving = false
}) {
  const isEdit = Boolean(event?.id);
  const platform = isPlatformEvent(event);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showConflictConfirm, setShowConflictConfirm] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (event) {
      setForm({
        title: event.title || "",
        eventType: event.eventType || MANUAL_EVENT_TYPES[0],
        startAt: toDatetimeLocalValue(event.startAt, timezone),
        endAt: toDatetimeLocalValue(event.endAt, timezone),
        caseRef: event.caseRef || "",
        location: event.location || "",
        notes: event.notes || "",
        reminders: event.reminders || [],
        visibility: event.visibility || EVENT_VISIBILITY.PRIVATE
      });
    } else if (defaults) {
      setForm({
        ...EMPTY_FORM,
        startAt: defaults.startAt
          ? toDatetimeLocalValue(defaults.startAt, timezone)
          : "",
        endAt: defaults.endAt ? toDatetimeLocalValue(defaults.endAt, timezone) : ""
      });
    } else {
      const now = new Date();
      const end = new Date(now.getTime() + 60 * 60 * 1000);
      setForm({
        ...EMPTY_FORM,
        startAt: toDatetimeLocalValue(now.toISOString(), timezone),
        endAt: toDatetimeLocalValue(end.toISOString(), timezone)
      });
    }
    setShowConflictConfirm(false);
  }, [isOpen, event, defaults, timezone]);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const toggleReminder = (value) => {
    setForm((f) => ({
      ...f,
      reminders: f.reminders.includes(value)
        ? f.reminders.filter((m) => m !== value)
        : [...f.reminders, value]
    }));
  };

  const buildPayload = () => {
    const payload = {
      notes: form.notes,
      reminders: form.reminders
    };

    if (!platform) {
      Object.assign(payload, {
        title: form.title.trim(),
        eventType: form.eventType,
        startAt: fromDatetimeLocalValue(form.startAt, timezone),
        endAt: fromDatetimeLocalValue(form.endAt, timezone),
        caseRef: form.caseRef.trim(),
        location: form.location.trim(),
        visibility: form.visibility
      });
    }

    return payload;
  };

  const handleSave = async (skipConflictCheck = false) => {
    const payload = buildPayload();

    if (!platform && !form.title.trim()) {
      alert("Title is required.");
      return;
    }

    if (!platform && payload.endAt && payload.startAt && payload.endAt <= payload.startAt) {
      alert("End time must be after start time.");
      return;
    }

    if (!platform && !skipConflictCheck && onCheckConflicts) {
      const list = await onCheckConflicts({
        startAt: payload.startAt,
        endAt: payload.endAt,
        excludeEventId: isEdit ? event.id : undefined
      });
      if (list.length > 0) {
        setShowConflictConfirm(true);
        return;
      }
    }

    await onSubmit(payload, isEdit ? event.id : null);
  };

  const typeOptions = MANUAL_EVENT_TYPES.map((t) => ({
    value: t,
    label: EVENT_TYPE_LABELS[t]
  }));

  const visibilityOptions = [
    { value: EVENT_VISIBILITY.PRIVATE, label: "Private" },
    { value: EVENT_VISIBILITY.SHARED, label: "Shared" }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? (platform ? "Edit booking notes" : "Edit event") : "New event"}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button loading={saving} onClick={() => handleSave(false)}>
            {isEdit ? "Save changes" : "Create event"}
          </Button>
        </>
      }
    >
      {platform && (
        <div className="mb-4 flex gap-2 p-3 rounded-lg bg-surface border border-border text-xs text-text-secondary">
          <FiAlertTriangle className="w-4 h-4 text-warning shrink-0" />
          Only notes and reminders can be edited for platform bookings.
        </div>
      )}

      {showConflictConfirm && conflicts.length > 0 && (
        <div className="mb-4 p-4 rounded-lg bg-warning/10 border border-warning/30">
          <div className="flex gap-2 items-start">
            <FiAlertTriangle className="w-5 h-5 text-warning shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary">Scheduling conflict</p>
              <p className="text-xs text-text-secondary mt-1">
                This overlaps with {conflicts.length} existing event
                {conflicts.length !== 1 ? "s" : ""}:
              </p>
              <ul className="mt-2 space-y-1 text-xs text-text-secondary">
                {conflicts.slice(0, 4).map((c) => (
                  <li key={c.id}>· {c.title}</li>
                ))}
              </ul>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="warning" loading={saving} onClick={() => handleSave(true)}>
                  Save anyway
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setShowConflictConfirm(false)}>
                  Adjust times
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!platform && (
        <>
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setField("title", e.target.value)}
            placeholder="e.g. High Court hearing – Case 123"
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Select
              label="Event type"
              value={form.eventType}
              onChange={(e) => setField("eventType", e.target.value)}
              options={typeOptions}
              placeholder=""
            />
            <Select
              label="Visibility"
              value={form.visibility}
              onChange={(e) => setField("visibility", e.target.value)}
              options={visibilityOptions}
              placeholder=""
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Input
              label="Start (PKT)"
              type="datetime-local"
              value={form.startAt}
              onChange={(e) => setField("startAt", e.target.value)}
            />
            <Input
              label="End (PKT)"
              type="datetime-local"
              value={form.endAt}
              onChange={(e) => setField("endAt", e.target.value)}
            />
          </div>
          <Input
            label="Location"
            value={form.location}
            onChange={(e) => setField("location", e.target.value)}
            placeholder="Court room, office, or address"
          />
          <Input
            label="Case reference"
            value={form.caseRef}
            onChange={(e) => setField("caseRef", e.target.value)}
            placeholder="Optional case or matter ID"
          />
        </>
      )}

      <Textarea
        label="Notes"
        value={form.notes}
        onChange={(e) => setField("notes", e.target.value)}
        rows={3}
        placeholder="Agenda, preparation notes, links…"
      />

      <div className="mb-2">
        <p className="text-sm font-medium text-text-secondary mb-2">Reminders</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {REMINDER_OPTIONS.map((opt) => (
            <Checkbox
              key={opt.value}
              label={opt.label}
              checked={form.reminders.includes(opt.value)}
              onChange={() => toggleReminder(opt.value)}
            />
          ))}
        </div>
      </div>
    </Modal>
  );
}
