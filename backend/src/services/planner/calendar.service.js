/**
 * Role-agnostic calendar service — delegates to planner operations using owner context.
 * Lawyer routes use this today; client routes will reuse the same module later.
 */
export {
  createEvent,
  listEvents,
  getTodayEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  findConflicts,
  syncFromBooking,
  cancelFromBooking
} from "./planner.service.js";
