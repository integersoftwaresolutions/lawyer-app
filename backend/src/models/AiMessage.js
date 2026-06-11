import mongoose from "mongoose";

const CitationSchema = new mongoose.Schema(
  {
    court: { type: String, default: "" },
    year: { type: Number, default: null },
    caseReference: { type: String, default: "" },
    sourceUrl: { type: String, default: "" },
    excerpt: { type: String, default: "" }
  },
  { _id: false }
);

const TokenUsageSchema = new mongoose.Schema(
  {
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 }
  },
  { _id: false }
);

const AiMessageSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "AiSession", required: true, index: true },
    role: { type: String, enum: ["user", "assistant", "system"], required: true },
    content: { type: String, required: true },
    citations: { type: [CitationSchema], default: [] },
    tokenUsage: { type: TokenUsageSchema, default: () => ({}) },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

AiMessageSchema.index({ sessionId: 1, createdAt: 1 });

export default mongoose.model("AiMessage", AiMessageSchema);
