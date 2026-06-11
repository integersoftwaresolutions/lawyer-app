import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../helpers/response.helper.js";
import * as calendarService from "../services/planner/calendar.service.js";
import { resolveCalendarOwner } from "../services/planner/calendar.context.js";

export const health = asyncHandler(async (req, res) => {
  return sendSuccess(res, {
    message: "Planner service is ready",
    data: { status: "ok", module: "calendar", version: "phase2-part4-v2" }
  });
});

export const createEvent = asyncHandler(async (req, res) => {
  const owner = resolveCalendarOwner(req);
  const data = await calendarService.createEvent(owner, req.body);
  return sendSuccess(res, { statusCode: 201, message: "Event created", data });
});

export const listEvents = asyncHandler(async (req, res) => {
  const owner = resolveCalendarOwner(req);
  const data = await calendarService.listEvents(owner, req.query);
  return sendSuccess(res, { message: "Events", data, meta: { count: data.length } });
});

export const getTodayEvents = asyncHandler(async (req, res) => {
  const owner = resolveCalendarOwner(req);
  const data = await calendarService.getTodayEvents(owner, req.query.timezone);
  return sendSuccess(res, { message: "Today's events", data, meta: { count: data.length } });
});

export const getConflicts = asyncHandler(async (req, res) => {
  const owner = resolveCalendarOwner(req);
  const data = await calendarService.findConflicts(owner, req.query);
  return sendSuccess(res, {
    message: "Conflicts",
    data,
    meta: { count: data.length, hasConflict: data.length > 0 }
  });
});

export const getEvent = asyncHandler(async (req, res) => {
  const owner = resolveCalendarOwner(req);
  const data = await calendarService.getEventById(req.params.eventId, owner);
  return sendSuccess(res, { message: "Event", data });
});

export const updateEvent = asyncHandler(async (req, res) => {
  const owner = resolveCalendarOwner(req);
  const data = await calendarService.updateEvent(req.params.eventId, owner, req.body);
  return sendSuccess(res, { message: "Event updated", data });
});

export const deleteEvent = asyncHandler(async (req, res) => {
  const owner = resolveCalendarOwner(req);
  const data = await calendarService.deleteEvent(req.params.eventId, owner);
  return sendSuccess(res, { message: "Event deleted", data });
});
