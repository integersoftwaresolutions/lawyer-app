import mongoose from "mongoose";
import {
  PLANNER_EVENT_TYPES,
  PLANNER_EVENT_SOURCES,
  PLANNER_EVENT_VISIBILITY,
  CALENDAR_OWNER_ROLES
} from "../config/constants.js";
import { PLANNER_DEFAULT_TIMEZONE, PLANNER_REMINDER_MINUTES } from "../config/planner.config.js";

const PlannerEventSchema = new mongoose.Schema(
  {
    /** Calendar owner — same shape for lawyer or client calendars. */
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    ownerRole: {
      type: String,
      enum: Object.values(CALENDAR_OWNER_ROLES),
      required: true,
      default: CALENDAR_OWNER_ROLES.LAWYER,
      index: true
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    eventType: {
      type: String,
      enum: Object.values(PLANNER_EVENT_TYPES),
      required: true,
      index: true
    },
    startAt: { type: Date, required: true, index: true },
    endAt: { type: Date, required: true, index: true },
    timezone: { type: String, default: PLANNER_DEFAULT_TIMEZONE },
    caseRef: { type: String, default: "", trim: true, maxlength: 200 },
    location: { type: String, default: "", trim: true, maxlength: 500 },
    notes: { type: String, default: "", maxlength: 5000 },
    reminders: {
      type: [Number],
      default: [],
      validate: {
        validator(arr) {
          return (arr || []).every((m) => PLANNER_REMINDER_MINUTES.includes(m));
        },
        message: "Invalid reminder offset"
      }
    },
    remindersSent: { type: [Number], default: [] },
    visibility: {
      type: String,
      enum: Object.values(PLANNER_EVENT_VISIBILITY),
      default: PLANNER_EVENT_VISIBILITY.PRIVATE
    },
    source: {
      type: String,
      enum: Object.values(PLANNER_EVENT_SOURCES),
      default: PLANNER_EVENT_SOURCES.MANUAL,
      index: true
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null
    },
    color: { type: String, default: "" },
    clientName: { type: String, default: "", trim: true, maxlength: 200 },
    consultationType: { type: String, default: "" },
    isCancelled: { type: Boolean, default: false, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

PlannerEventSchema.index({ ownerId: 1, ownerRole: 1, startAt: 1, endAt: 1 });
PlannerEventSchema.index(
  { bookingId: 1 },
  { unique: true, partialFilterExpression: { bookingId: { $type: "objectId" } } }
);
PlannerEventSchema.index({ ownerId: 1, ownerRole: 1, isCancelled: 1, startAt: 1 });

export default mongoose.model("PlannerEvent", PlannerEventSchema);
