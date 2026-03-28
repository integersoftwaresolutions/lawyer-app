import mongoose from "mongoose";
import { DISPUTE_STATUS, DISPUTE_REASON, DISPUTE_RESOLUTION } from "../config/constants.js";

const DisputeSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
    raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    raisedAgainst: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    reason: { type: String, enum: Object.values(DISPUTE_REASON), required: true },
    description: { type: String, default: "" },
    status: { type: String, enum: Object.values(DISPUTE_STATUS), default: DISPUTE_STATUS.OPEN, index: true },
    resolution: { type: String, enum: Object.values(DISPUTE_RESOLUTION), default: null },
    resolutionNote: { type: String, default: "" },
    refundAmount: { type: Number, default: 0 },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    resolvedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

DisputeSchema.index({ bookingId: 1, status: 1 });

export default mongoose.model("Dispute", DisputeSchema);
