import mongoose from "mongoose";

const ClientProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true, index: true, required: true },
    fullName: { type: String, default: "" },
    phone: { type: String, default: "" },
    city: { type: String, default: "" },
    address: { type: String, default: "" },
    profileImage: { type: String, default: "" }
  },
  { timestamps: true }
);

export default mongoose.model("ClientProfile", ClientProfileSchema);
