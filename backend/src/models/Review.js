import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    lawyerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
    isDisputed: { type: Boolean, default: false },
    disputeReason: { type: String, default: "" }
  },
  { timestamps: true }
);

ReviewSchema.index({ bookingId: 1 }, { unique: true });

export default mongoose.model("Review", ReviewSchema);
