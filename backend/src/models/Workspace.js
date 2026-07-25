import mongoose from "mongoose";
import { WORKSPACE_TYPES } from "../config/constants.js";

const WorkspaceSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: Object.values(WORKSPACE_TYPES),
      required: true,
      index: true
    },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    /** Unique slug for firms (invites / future firm pages). Personal may omit. */
    slug: { type: String, trim: true, lowercase: true, maxlength: 80, default: null },
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    // Firm profile (W3.c)
    logoMediaId: { type: mongoose.Schema.Types.ObjectId, ref: "Media", default: null },
    address: { type: String, default: "", trim: true, maxlength: 500 },
    phone: { type: String, default: "", trim: true, maxlength: 40 },
    website: { type: String, default: "", trim: true, maxlength: 300 },
    practiceAreas: { type: [String], default: [] },
    city: { type: String, default: "", trim: true, maxlength: 100 },
    description: { type: String, default: "", trim: true, maxlength: 4000 },

    /** Phase 3 billing hooks (nullable until subscriptions). */
    planId: { type: String, default: null },
    seatLimit: { type: Number, default: null },

    deletedAt: { type: Date, default: null, index: true }
  },
  { timestamps: true }
);

WorkspaceSchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { slug: { $type: "string" }, deletedAt: null } }
);
WorkspaceSchema.index({ ownerUserId: 1, type: 1, deletedAt: 1 });

export default mongoose.model("Workspace", WorkspaceSchema);
