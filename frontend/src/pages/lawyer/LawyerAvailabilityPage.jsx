import { useMemo, useState } from "react";
import {
  FiClock,
  FiPlus,
  FiTrash2,
  FiCopy,
  FiCalendar,
  FiSun,
  FiSave
} from "react-icons/fi";
import { lawyerApi } from "../../services/lawyer.api";
import { Button, Card, IconButton, StateHandler } from "../../components/ui";
import { useStateHandler } from "../../hooks/useStateHandler";
import { useToast } from "../../hooks/useToast";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];

const DAY_META = {
  monday: { label: "Monday", short: "Mon" },
  tuesday: { label: "Tuesday", short: "Tue" },
  wednesday: { label: "Wednesday", short: "Wed" },
  thursday: { label: "Thursday", short: "Thu" },
  friday: { label: "Friday", short: "Fri" },
  saturday: { label: "Saturday", short: "Sat" },
  sunday: { label: "Sunday", short: "Sun" }
};

function timeToMinutes(time) {
  if (!time) return 0;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function formatHours(hours) {
  if (hours <= 0) return "0h";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function slotDurationMinutes(slot) {
  return Math.max(0, timeToMinutes(slot.end) - timeToMinutes(slot.start));
}

function dayHours(slots = []) {
  return slots.reduce((sum, slot) => sum + slotDurationMinutes(slot), 0) / 60;
}

function countActiveDays(availability) {
  return DAYS.filter((day) => availability[day]?.enabled).length;
}

function countTotalSlots(availability) {
  return DAYS.reduce((sum, day) => {
    if (!availability[day]?.enabled) return sum;
    return sum + (availability[day]?.slots?.length || 0);
  }, 0);
}

function weeklyHours(availability) {
  return DAYS.reduce((sum, day) => {
    if (!availability[day]?.enabled) return sum;
    return sum + dayHours(availability[day]?.slots);
  }, 0);
}

function DayToggle({ enabled, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={`Toggle ${label}`}
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
        enabled ? "bg-primary" : "bg-border"
      }`}
    >
      <span
        className={`inline-block rounded-full bg-white shadow-sm transition-transform duration-200 ${
          enabled ? "translate-x-[18px]" : "translate-x-0.5"
        }`}
        style={{ width: 16, height: 16 }}
      />
    </button>
  );
}

function TimeInput({ value, onChange }) {
  return (
    <input
      type="time"
      value={value}
      onChange={onChange}
      className="w-[7.25rem] py-1.5 px-2.5 rounded-md border border-input-border bg-input-background text-input-text text-sm outline-none transition-colors focus:border-primary"
    />
  );
}

function DayRow({
  day,
  availability,
  onToggle,
  onAddSlot,
  onUpdateSlot,
  onRemoveSlot
}) {
  const meta = DAY_META[day];
  const dayData = availability[day] || { enabled: false, slots: [] };
  const enabled = Boolean(dayData.enabled);
  const slots = dayData.slots || [];
  const hours = dayHours(slots);
  const isWeekend = day === "saturday" || day === "sunday";

  if (!enabled) {
    return (
      <div className="flex items-center gap-4 py-3.5 sm:py-4">
        <div className="w-24 sm:w-28 shrink-0">
          <p className="text-sm font-medium text-text-muted">{meta.label}</p>
          {isWeekend && <p className="text-[10px] text-text-muted/70 mt-0.5">Weekend</p>}
        </div>
        <p className="flex-1 text-sm text-text-muted/80">Unavailable</p>
        <DayToggle enabled={false} onChange={onToggle} label={meta.label} />
      </div>
    );
  }

  return (
    <div className="py-3.5 sm:py-4">
      <div className="flex items-start gap-4">
        <div className="w-24 sm:w-28 shrink-0 pt-0.5">
          <p className="text-sm font-semibold text-text-primary">{meta.label}</p>
          {isWeekend && <p className="text-[10px] text-text-muted mt-0.5">Weekend</p>}
          <p className="text-[11px] text-text-muted mt-0.5">{formatHours(hours)} total</p>
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          {slots.map((slot, index) => (
            <div key={index} className="flex items-center gap-2 flex-wrap">
              <TimeInput
                value={slot.start || "09:00"}
                onChange={(e) => onUpdateSlot(index, "start", e.target.value)}
              />
              <span className="text-text-muted text-xs select-none">—</span>
              <TimeInput
                value={slot.end || "17:00"}
                onChange={(e) => onUpdateSlot(index, "end", e.target.value)}
              />
              <span className="text-[11px] text-text-muted tabular-nums w-8">
                {formatHours(slotDurationMinutes(slot) / 60)}
              </span>
              {slots.length > 1 && (
                <IconButton
                  icon={FiTrash2}
                  label="Remove time slot"
                  variant="ghost"
                  size="icon-sm"
                  className="text-text-muted hover:text-danger hover:bg-danger/10 -ml-1"
                  onClick={() => onRemoveSlot(index)}
                />
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={onAddSlot}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-hover transition-colors"
          >
            <FiPlus className="w-3.5 h-3.5" />
            Add time slot
          </button>
        </div>

        <div className="shrink-0 pt-0.5">
          <DayToggle enabled={enabled} onChange={onToggle} label={meta.label} />
        </div>
      </div>
    </div>
  );
}

export default function LawyerAvailabilityPage() {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState("");

  const { loading, error, data, retry, setData } = useStateHandler(async () => {
    const res = await lawyerApi.getMyAvailability();
    const payload = res.data || {};
    setSavedSnapshot(JSON.stringify(payload));
    return payload;
  });

  const availability = data || {};

  const stats = useMemo(
    () => ({
      activeDays: countActiveDays(availability),
      totalHours: weeklyHours(availability),
      totalSlots: countTotalSlots(availability)
    }),
    [availability]
  );

  const isDirty = savedSnapshot && JSON.stringify(availability) !== savedSnapshot;

  const patchDay = (day, patch) => {
    setData({
      ...availability,
      [day]: { ...availability[day], ...patch }
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await lawyerApi.updateMyAvailability(availability);
      setSavedSnapshot(JSON.stringify(availability));
      toast.success("Availability updated successfully");
      retry();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save availability");
    } finally {
      setSaving(false);
    }
  };

  const enableWeekdays = () => {
    const updated = { ...availability };
    WEEKDAYS.forEach((day) => {
      updated[day] = {
        enabled: true,
        slots: updated[day]?.slots?.length
          ? updated[day].slots
          : [{ start: "09:00", end: "17:00" }]
      };
    });
    setData(updated);
  };

  const copyMondayToWeekdays = () => {
    const monday = availability.monday;
    if (!monday?.enabled || !monday.slots?.length) {
      toast.error("Enable Monday and add at least one slot first");
      return;
    }
    const updated = { ...availability };
    ["tuesday", "wednesday", "thursday", "friday"].forEach((day) => {
      updated[day] = {
        enabled: true,
        slots: monday.slots.map((s) => ({ ...s }))
      };
    });
    setData(updated);
    toast.success("Monday schedule copied to Tue–Fri");
  };

  return (
    <StateHandler loading={loading} error={error} retry={retry}>
      <div className="flex flex-col min-h-0">
        {/* Page header */}
        <div className="shrink-0 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4 sm:mb-6">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
              <FiClock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-text-primary leading-tight">
                Weekly Availability
              </h1>
              <p className="text-xs sm:text-sm text-text-muted mt-1 max-w-xl">
                Set when clients can book consultations. Times are shown in PKT (Asia/Karachi).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <Button variant="secondary" size="sm" onClick={enableWeekdays}>
              Enable weekdays
            </Button>
            <Button variant="secondary" size="sm" icon={FiCopy} onClick={copyMondayToWeekdays}>
              Copy Mon → Fri
            </Button>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5 sm:mb-6">
          <Card padding="p-4" className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
              <FiCalendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary leading-none">{stats.activeDays}</p>
              <p className="text-xs text-text-muted mt-1">Active days</p>
            </div>
          </Card>
          <Card padding="p-4" className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-success/10 text-success">
              <FiClock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary leading-none">
                {formatHours(stats.totalHours)}
              </p>
              <p className="text-xs text-text-muted mt-1">Hours per week</p>
            </div>
          </Card>
          <Card padding="p-4" className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-accent/10 text-accent">
              <FiSun className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary leading-none">{stats.totalSlots}</p>
              <p className="text-xs text-text-muted mt-1">Time slots</p>
            </div>
          </Card>
        </div>

        {/* Day schedule */}
        <Card
          title="Your schedule"
          subtitle="Toggle each day and add one or more booking windows"
          padding="p-4 sm:p-6"
          className="flex-1 min-h-0"
        >
          <div className="[&>*+*]:border-t [&>*+*]:border-card-border">
            {DAYS.map((day) => (
              <DayRow
                key={day}
                day={day}
                availability={availability}
                onToggle={() =>
                  patchDay(day, {
                    enabled: !availability[day]?.enabled,
                    slots: availability[day]?.slots?.length
                      ? availability[day].slots
                      : [{ start: "09:00", end: "17:00" }]
                  })
                }
                onAddSlot={() => {
                  const slots = [...(availability[day]?.slots || []), { start: "09:00", end: "17:00" }];
                  patchDay(day, { slots });
                }}
                onUpdateSlot={(index, field, value) => {
                  const slots = [...(availability[day]?.slots || [])];
                  slots[index] = { ...slots[index], [field]: value };
                  patchDay(day, { slots });
                }}
                onRemoveSlot={(index) => {
                  const slots = (availability[day]?.slots || []).filter((_, i) => i !== index);
                  patchDay(day, { slots });
                }}
              />
            ))}
          </div>
        </Card>

        {/* Sticky save bar */}
        <div className="sticky bottom-0 z-10 mt-6 -mx-1 px-1 pt-4 bg-gradient-to-t from-background from-60% to-transparent">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 rounded-xl border border-border bg-card/95 backdrop-blur-md shadow-lg">
              <div className="min-w-0">
                {isDirty ? (
                  <p className="text-sm font-medium text-warning">You have unsaved changes</p>
                ) : (
                  <p className="text-sm text-text-muted">All changes saved</p>
                )}
                <p className="text-xs text-text-muted mt-0.5 hidden sm:block">
                  Clients only see slots within your enabled hours
                </p>
              </div>
              <Button
                icon={FiSave}
                onClick={handleSave}
                loading={saving}
                disabled={!isDirty && !saving}
                className="w-full sm:w-auto"
              >
                Save availability
              </Button>
          </div>
        </div>
      </div>
    </StateHandler>
  );
}
