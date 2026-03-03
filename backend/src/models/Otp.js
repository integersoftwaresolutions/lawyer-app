import mongoose from "mongoose";

const OtpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, index: true },
    code: { type: String, required: true },
    purpose: { type: String, enum: ["EMAIL_VERIFICATION", "PASSWORD_RESET"], default: "EMAIL_VERIFICATION" },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } }
  },
  { timestamps: true }
);

// Compound index for email and purpose
OtpSchema.index({ email: 1, purpose: 1 });

export default mongoose.model("Otp", OtpSchema);

