import mongoose from "mongoose";
import { BOOKING_STATUS } from "../config/constants.js";

const SessionSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", unique: true, required: true },
    status: { type: String, enum: Object.values(BOOKING_STATUS), default: BOOKING_STATUS.BOOKED, index: true },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },

    allowChat: { type: Boolean, default: true },
    allowVideo: { type: Boolean, default: false },
    allowContactUnlock: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model("Session", SessionSchema);
