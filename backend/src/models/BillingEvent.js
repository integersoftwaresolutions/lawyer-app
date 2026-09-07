import mongoose from "mongoose";

const BillingEventSchema = new mongoose.Schema(
  {
    providerEventId: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: true, index: true },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      default: null,
      index: true
    },
    summary: { type: mongoose.Schema.Types.Mixed, default: {} },
    processedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model("BillingEvent", BillingEventSchema);
