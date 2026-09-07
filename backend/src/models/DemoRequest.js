import mongoose from "mongoose";

export const DEMO_INTERESTS = ["demo", "setup", "pricing", "other"];
export const DEMO_STATUSES = ["new", "contacted", "qualified", "closed"];

const DemoRequestSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254, index: true },
    company: { type: String, required: true, trim: true, maxlength: 160 },
    phone: { type: String, default: "", trim: true, maxlength: 40 },
    roleTitle: { type: String, default: "", trim: true, maxlength: 120 },
    interest: {
      type: String,
      enum: DEMO_INTERESTS,
      default: "demo",
      index: true
    },
    teamSize: { type: String, default: "", trim: true, maxlength: 40 },
    message: { type: String, default: "", trim: true, maxlength: 2000 },
    source: { type: String, default: "request-demo", trim: true, maxlength: 80 },
    /** Honeypot — should always be empty for real humans */
    website: { type: String, default: "", select: false },
    status: {
      type: String,
      enum: DEMO_STATUSES,
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

DemoRequestSchema.index({ createdAt: -1 });

export default mongoose.model("DemoRequest", DemoRequestSchema);
