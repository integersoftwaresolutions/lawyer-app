import mongoose from "mongoose";
import { BOOKING_STATUS, CONSULTATION_TYPE } from "../config/constants.js";

const BookingSchema = new mongoose.Schema(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    lawyerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    startAt: { type: Date, required: true, index: true },
    durationMinutes: { type: Number, required: true },
    consultationType: { 
      type: String, 
      enum: Object.values(CONSULTATION_TYPE), 
      default: CONSULTATION_TYPE.CHAT_VIDEO 
    },
    status: { type: String, enum: Object.values(BOOKING_STATUS), default: BOOKING_STATUS.BOOKED, index: true },
    amount: { type: Number, default: 0 },
    platformFee: { type: Number, default: 0 },
    lawyerEarning: { type: Number, default: 0 },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date, default: null },
    hasReview: { type: Boolean, default: false },
    notes: { type: String, default: "" },
    cancelReason: { type: String, default: "" },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reminderMinutesSent: { type: [Number], default: [] },
    deletedByClient: { type: Boolean, default: false, index: true },
    deletedByLawyer: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

export default mongoose.model("Booking", BookingSchema);
