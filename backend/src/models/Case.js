import mongoose from "mongoose";
import {
  CASE_PRIORITY,
  CASE_STATUS,
  CASE_TYPES,
  CASE_VISIBILITY,
  PAKISTANI_COURTS
} from "../config/constants.js";

const PartySchema = new mongoose.Schema(
  {
    name: { type: String, default: "", trim: true, maxlength: 300 },
    contact: { type: String, default: "", trim: true, maxlength: 300 },
    counsel: { type: String, default: "", trim: true, maxlength: 300 }
  },
  { _id: false }
);

const CaseNoteSchema = new mongoose.Schema(
  {
    body: { type: String, required: true, trim: true, maxlength: 10000 },
    authorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const CaseSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true
    },
    name: { type: String, required: true, trim: true, maxlength: 300 },
    type: {
      type: String,
      enum: Object.values(CASE_TYPES),
      required: true,
      index: true
    },
    typeCustom: { type: String, default: "", trim: true, maxlength: 120 },
    status: {
      type: String,
      enum: Object.values(CASE_STATUS),
      default: CASE_STATUS.INTAKE,
      index: true
    },
    customLabels: { type: [String], default: [] },
    priority: {
      type: String,
      enum: Object.values(CASE_PRIORITY),
      default: CASE_PRIORITY.MEDIUM,
      index: true
    },
    summary: { type: String, default: "", trim: true, maxlength: 1000 },
    description: { type: String, default: "", trim: true, maxlength: 20000 },
    tags: { type: [String], default: [] },

    openedAt: { type: Date, default: Date.now },
    nextHearingAt: { type: Date, default: null },
    filingAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },

    court: {
      type: String,
      enum: [...PAKISTANI_COURTS, ""],
      default: ""
    },
    jurisdictionCity: { type: String, default: "", trim: true, maxlength: 120 },
    caseNumber: { type: String, default: "", trim: true, maxlength: 120, index: true },

    parties: {
      client: { type: PartySchema, default: () => ({}) },
      opponent: { type: PartySchema, default: () => ({}) },
      court: { type: PartySchema, default: () => ({}) },
      counsel: { type: PartySchema, default: () => ({}) }
    },

    primaryLawyerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    collaboratorUserIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: []
    },

    visibility: {
      type: String,
      enum: Object.values(CASE_VISIBILITY),
      default: CASE_VISIBILITY.PRIVATE,
      index: true
    },
    restrictedMemberIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: []
    },

    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null
    },

    notes: { type: [CaseNoteSchema], default: [] },

    isArchived: { type: Boolean, default: false, index: true },
    archivedAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },

    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    updatedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  { timestamps: true }
);

CaseSchema.index({ workspaceId: 1, isDeleted: 1, isArchived: 1, updatedAt: -1 });
CaseSchema.index({ workspaceId: 1, primaryLawyerUserId: 1, isDeleted: 1 });
CaseSchema.index({ workspaceId: 1, collaboratorUserIds: 1 });
CaseSchema.index({ workspaceId: 1, status: 1, priority: 1 });
CaseSchema.index({ workspaceId: 1, tags: 1 });
CaseSchema.index({
  name: "text",
  summary: "text",
  caseNumber: "text",
  tags: "text"
});

export default mongoose.model("Case", CaseSchema);
