import api from "../apiClient";

/**
 * Factory for role-agnostic calendar API clients.
 * Lawyer routes use `/planner`; future client routes can pass a different basePath.
 *
 * @example
 * const lawyerCalendar = createCalendarApi({ basePath: "/planner" });
 * const clientCalendar = createCalendarApi({ basePath: "/client/planner" });
 */
export function createCalendarApi({ basePath = "/planner" } = {}) {
  const root = basePath.replace(/\/$/, "");
  const eventsPath = `${root}/events`;

  return {
    listEvents: (params) => api.get(eventsPath, { params }).then((r) => r.data),
    createEvent: (body) => api.post(eventsPath, body).then((r) => r.data),
    getEvent: (eventId) => api.get(`${eventsPath}/${eventId}`).then((r) => r.data),
    updateEvent: (eventId, body) =>
      api.patch(`${eventsPath}/${eventId}`, body).then((r) => r.data),
    deleteEvent: (eventId) => api.delete(`${eventsPath}/${eventId}`).then((r) => r.data),
    getConflicts: (params) =>
      api.get(`${eventsPath}/conflicts`, { params }).then((r) => r.data),
    getTodayEvents: (params) =>
      api.get(`${eventsPath}/today`, { params }).then((r) => r.data)
  };
}
