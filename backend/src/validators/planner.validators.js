import Joi from "joi";
import {
  PLANNER_EVENT_TYPES,
  PLANNER_EVENT_VISIBILITY,
  PLANNER_REMINDER_MINUTES,
  PLANNER_DEFAULT_TIMEZONE
} from "../config/planner.config.js";

const objectId = Joi.string().hex().length(24);

const eventBodyBase = {
  title: Joi.string().trim().min(1).max(200),
  eventType: Joi.string().valid(
    PLANNER_EVENT_TYPES.COURT_HEARING,
    PLANNER_EVENT_TYPES.CLIENT_MEETING,
    PLANNER_EVENT_TYPES.INTERNAL,
    PLANNER_EVENT_TYPES.DEADLINE,
    PLANNER_EVENT_TYPES.OTHER
  ),
  startAt: Joi.date().iso(),
  endAt: Joi.date().iso(),
  timezone: Joi.string().trim().max(64).default(PLANNER_DEFAULT_TIMEZONE),
  caseRef: Joi.string().trim().max(200).allow(""),
  location: Joi.string().trim().max(500).allow(""),
  notes: Joi.string().max(5000).allow(""),
  reminders: Joi.array()
    .items(Joi.number().valid(...PLANNER_REMINDER_MINUTES))
    .max(4)
    .default([]),
  visibility: Joi.string()
    .valid(...Object.values(PLANNER_EVENT_VISIBILITY))
    .default(PLANNER_EVENT_VISIBILITY.PRIVATE)
};

export const createEventSchema = Joi.object({
  body: Joi.object({
    ...eventBodyBase,
    title: eventBodyBase.title.required(),
    eventType: eventBodyBase.eventType.required(),
    startAt: eventBodyBase.startAt.required(),
    endAt: eventBodyBase.endAt.required()
  }).required()
});

export const updateEventSchema = Joi.object({
  params: Joi.object({ eventId: objectId.required() }).required(),
  body: Joi.object(eventBodyBase).min(1).required()
});

export const eventIdParamSchema = Joi.object({
  params: Joi.object({ eventId: objectId.required() }).required()
});

export const listEventsSchema = Joi.object({
  query: Joi.object({
    from: Joi.date().iso().required(),
    to: Joi.date().iso().required(),
    eventType: Joi.string()
      .valid(...Object.values(PLANNER_EVENT_TYPES))
      .optional(),
    source: Joi.string().valid("MANUAL", "BOOKING").optional()
  }).required()
});

export const conflictCheckSchema = Joi.object({
  query: Joi.object({
    startAt: Joi.date().iso().required(),
    endAt: Joi.date().iso().required(),
    excludeEventId: objectId.optional()
  }).required()
});

export const todayEventsSchema = Joi.object({
  query: Joi.object({
    timezone: Joi.string().trim().max(64).optional()
  }).optional()
});
