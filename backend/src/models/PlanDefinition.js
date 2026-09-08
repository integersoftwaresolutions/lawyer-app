import mongoose from "mongoose";
import { PLAN_KEYS } from "../billing/planCatalog.js";

/**
 * Editable plan entitlements. Limits/features use dotted string keys
 * (e.g. cases.active) stored as Mixed maps — not nested subdocs.
 */
const PlanDefinitionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      enum: Object.values(PLAN_KEYS),
      required: true,
      unique: true,
      index: true
    },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    limits: { type: mongoose.Schema.Types.Mixed, required: true },
    features: { type: mongoose.Schema.Types.Mixed, required: true },
    displayPrice: { type: Number, required: true, min: 0 },
    version: { type: Number, default: 1 },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
  },
  { timestamps: true }
);

export default mongoose.model("PlanDefinition", PlanDefinitionSchema);
