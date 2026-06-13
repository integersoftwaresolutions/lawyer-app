import { useCallback, useEffect, useMemo, useState } from "react";
import { CALENDAR_VIEWS, DEFAULT_TIMEZONE } from "../constants/calendar.constants";
import { getViewRange, addDays, addMonths, toDateKey } from "../utils/calendar/dateUtils";
import { getErrorMessage } from "../utils/errorHandler";

export function useCalendar({ api, timezone = DEFAULT_TIMEZONE, initialView = CALENDAR_VIEWS.MONTH } = {}) {
  const [view, setView] = useState(initialView);
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDayKey, setSelectedDayKey] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formDefaults, setFormDefaults] = useState(null);
  const [saving, setSaving] = useState(false);
  const [conflicts, setConflicts] = useState([]);

  const range = useMemo(() => getViewRange(view, anchorDate, timezone), [view, anchorDate, timezone]);

  const loadEvents = useCallback(async () => {
    if (!api?.listEvents) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.listEvents(range);
      setEvents(res.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [api, range]);

  const checkConflicts = useCallback(
    async ({ startAt, endAt, excludeEventId = null }) => {
      if (!api?.getConflicts) return [];
      try {
        const res = await api.getConflicts({ startAt, endAt, excludeEventId });
        const list = res.data || [];
        setConflicts(list);
        return list;
      } catch {
        return [];
      }
    },
    [api]
  );

  const createEvent = useCallback(
    async (payload) => {
      setSaving(true);
      setError(null);
      try {
        const res = await api.createEvent(payload);
        await loadEvents();
        return res.data;
      } catch (err) {
        const msg = getErrorMessage(err);
        setError(msg);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [api, loadEvents]
  );

  const updateEvent = useCallback(
    async (eventId, payload) => {
      setSaving(true);
      setError(null);
      try {
        const res = await api.updateEvent(eventId, payload);
        setSelectedEvent(res.data);
        await loadEvents();
        return res.data;
      } catch (err) {
        const msg = getErrorMessage(err);
        setError(msg);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [api, loadEvents]
  );

  const deleteEvent = useCallback(
    async (eventId) => {
      setSaving(true);
      setError(null);
      try {
        await api.deleteEvent(eventId);
        setSelectedEvent(null);
        await loadEvents();
      } catch (err) {
        const msg = getErrorMessage(err);
        setError(msg);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [api, loadEvents]
  );

  const goToday = useCallback(() => setAnchorDate(new Date()), []);

  const goPrev = useCallback(() => {
    setAnchorDate((d) => {
      if (view === CALENDAR_VIEWS.DAY) return addDays(d, -1);
      if (view === CALENDAR_VIEWS.WEEK) return addDays(d, -7);
      return addMonths(d, -1);
    });
  }, [view]);

  const goNext = useCallback(() => {
    setAnchorDate((d) => {
      if (view === CALENDAR_VIEWS.DAY) return addDays(d, 1);
      if (view === CALENDAR_VIEWS.WEEK) return addDays(d, 7);
      return addMonths(d, 1);
    });
  }, [view]);

  const openCreate = useCallback((defaults = {}) => {
    setSelectedEvent(null);
    setFormDefaults(defaults);
    setFormOpen(true);
    setConflicts([]);
  }, []);

  const openEdit = useCallback((event) => {
    setSelectedEvent(event);
    setFormDefaults(null);
    setFormOpen(true);
    setConflicts([]);
  }, []);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setFormDefaults(null);
    setConflicts([]);
  }, []);

  const selectDay = useCallback((dateKey) => {
    setSelectedDayKey(dateKey);
    setSelectedEvent(null);
  }, []);

  const selectEvent = useCallback((event) => {
    setSelectedEvent(event);
  }, []);

  /** Open event detail with that day’s list behind the back button. */
  const selectDayEvent = useCallback(
    (event) => {
      setSelectedDayKey(toDateKey(event.startAt, timezone));
      setSelectedEvent(event);
    },
    [timezone]
  );

  const backToDayList = useCallback(() => setSelectedEvent(null), []);

  const clearSelection = useCallback(() => {
    setSelectedEvent(null);
    setSelectedDayKey(null);
  }, []);

  const eventsByDate = useMemo(() => {
    const map = {};
    for (const ev of events) {
      const startKey = toDateKey(ev.startAt, timezone);
      const endKey = toDateKey(ev.endAt, timezone);
      let cursor = startKey;
      const keys = new Set();
      while (true) {
        keys.add(cursor);
        if (cursor === endKey) break;
        const d = new Date(`${cursor}T12:00:00+05:00`);
        cursor = toDateKey(addDays(d, 1), timezone);
        if (keys.size > 366) break;
      }
      keys.forEach((k) => {
        if (!map[k]) map[k] = [];
        map[k].push(ev);
      });
    }
    Object.values(map).forEach((list) =>
      list.sort((a, b) => new Date(a.startAt) - new Date(b.startAt))
    );
    return map;
  }, [events, timezone]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  return {
    view,
    setView,
    anchorDate,
    setAnchorDate,
    timezone,
    events,
    eventsByDate,
    loading,
    error,
    saving,
    selectedEvent,
    selectedDayKey,
    formOpen,
    formDefaults,
    conflicts,
    range,
    loadEvents,
    checkConflicts,
    createEvent,
    updateEvent,
    deleteEvent,
    goToday,
    goPrev,
    goNext,
    openCreate,
    openEdit,
    closeForm,
    selectDay,
    selectEvent,
    selectDayEvent,
    backToDayList,
    clearSelection,
    setError,
    clearConflicts: () => setConflicts([])
  };
}
