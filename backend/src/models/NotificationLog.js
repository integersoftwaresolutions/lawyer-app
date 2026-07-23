import mongoose from "mongoose";
import { NOTIFICATION_TYPES, NOTIFICATION_CHANNELS } from "../config/notification.constants.js";

const NotificationLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES),
      required: true,
      index: true
    },
    channel: {
      type: String,
      enum: Object.values(NOTIFICATION_CHANNELS),
      default: NOTIFICATION_CHANNELS.EMAIL,
      index: true
    },
    recipientEmail: { type: String, default: "" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    status: { type: String, enum: ["sent", "failed", "skipped"], default: "sent" },
    error: { type: String, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

NotificationLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default mongoose.model("NotificationLog", NotificationLogSchema);
