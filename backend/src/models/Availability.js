import mongoose from "mongoose";

const TimeSlotSchema = new mongoose.Schema({
  start: { type: String, required: true },
  end: { type: String, required: true }
}, { _id: false });

const AvailabilitySchema = new mongoose.Schema(
  {
    lawyerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true, index: true, required: true },
    monday: { enabled: { type: Boolean, default: true }, slots: [TimeSlotSchema] },
    tuesday: { enabled: { type: Boolean, default: true }, slots: [TimeSlotSchema] },
    wednesday: { enabled: { type: Boolean, default: true }, slots: [TimeSlotSchema] },
    thursday: { enabled: { type: Boolean, default: true }, slots: [TimeSlotSchema] },
    friday: { enabled: { type: Boolean, default: true }, slots: [TimeSlotSchema] },
    saturday: { enabled: { type: Boolean, default: false }, slots: [TimeSlotSchema] },
    sunday: { enabled: { type: Boolean, default: false }, slots: [TimeSlotSchema] }
  },
  { timestamps: true }
);

export default mongoose.model("Availability", AvailabilitySchema);
