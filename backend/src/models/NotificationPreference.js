import mongoose from "mongoose";

/**
 * Per-user notification channel preferences.
 * preferences: { [NOTIFICATION_TYPE]: { email?: boolean, in_app?: boolean } }
 * Omitted or true = enabled (opt-out defaults).
 */
const NotificationPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
      index: true
    },
    preferences: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

export default mongoose.model("NotificationPreference", NotificationPreferenceSchema);
