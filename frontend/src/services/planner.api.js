import { createCalendarApi } from "./calendar/createCalendarApi";

/** Lawyer Smart Planner — swap basePath when client calendar routes ship. */
export const plannerApi = createCalendarApi({ basePath: "/planner" });
