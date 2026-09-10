import mongoose from "mongoose";

export const FEATURE_STATUSES = ["new", "contacted", "qualified", "closed"];

const FeatureRequestSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254, index: true },
    phone: { type: String, required: true, trim: true, maxlength: 40 },
    feature: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
    source: { type: String, default: "request-feature", trim: true, maxlength: 80 },
    /** Honeypot — should always be empty for real humans */
    website: { type: String, default: "", select: false },
    status: {
      type: String,
      enum: FEATURE_STATUSES,
      default: "new",
      index: true
    },
    emailNotifiedAt: { type: Date, default: null },
    emailError: { type: String, default: "" },
    meta: {
      ip: { type: String, default: "" },
      userAgent: { type: String, default: "", maxlength: 500 }
    }
  },
  { timestamps: true }
);

FeatureRequestSchema.index({ createdAt: -1 });

export default mongoose.model("FeatureRequest", FeatureRequestSchema);
