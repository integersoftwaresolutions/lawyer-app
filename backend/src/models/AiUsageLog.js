import mongoose from "mongoose";
import { AI_MODES, AI_USAGE_TYPES } from "../config/constants.js";

const AiUsageLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "AiSession", default: null, index: true },
    messageId: { type: mongoose.Schema.Types.ObjectId, ref: "AiMessage", default: null },
    type: { type: String, enum: Object.values(AI_USAGE_TYPES), required: true, index: true },
    mode: { type: String, enum: [...Object.values(AI_MODES), null], default: null },
    model: { type: String, required: true },
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    estimatedCostUsd: { type: Number, default: 0 },
    billableUnits: { type: Number, default: 0 },
    billed: { type: Boolean, default: false, index: true },
    ledgerEntryId: { type: mongoose.Schema.Types.ObjectId, ref: "LedgerEntry", default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

AiUsageLogSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("AiUsageLog", AiUsageLogSchema);
