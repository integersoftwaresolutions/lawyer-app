import mongoose from "mongoose";

const ClientProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true, index: true, required: true },
    fullName: { type: String, default: "" },
    phone: { type: String, default: "" },
    whatsapp: { type: String, default: "" },
    city: { type: String, default: "", index: true },
    address: { type: String, default: "" },
    cnic: { type: String, default: "" }, // CNIC for Pakistani clients
    dateOfBirth: { type: Date, default: null },
    gender: { type: String, enum: ["Male", "Female", "Other", ""], default: "" },
    profileImage: { type: String, default: "" }
  },
  { timestamps: true }
);

export default mongoose.model("ClientProfile", ClientProfileSchema);
