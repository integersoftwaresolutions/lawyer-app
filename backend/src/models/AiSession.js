import mongoose from "mongoose";
import { AI_MODES } from "../config/constants.js";

const AiSessionSchema = new mongoose.Schema(
  {
    lawyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, default: "New conversation", trim: true, maxlength: 200 },
    mode: {
      type: String,
      enum: Object.values(AI_MODES),
      default: AI_MODES.RESEARCH,
      index: true
    },
    caseRef: { type: String, default: "", trim: true, maxlength: 200 },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    isDeleted: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

AiSessionSchema.index({ lawyerId: 1, isDeleted: 1, updatedAt: -1 });

export default mongoose.model("AiSession", AiSessionSchema);
