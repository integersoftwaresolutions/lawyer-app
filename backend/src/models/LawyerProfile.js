import mongoose from "mongoose";

const LawyerProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true, index: true, required: true },
    fullName: { type: String, required: true },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    whatsapp: { type: String, default: "" },
    city: { type: String, index: true, default: "" },
    officeAddress: { type: String, default: "" },
    specialization: { type: [String], index: true, default: [] },
    languages: { type: [String], default: ["English"] },
    experienceYears: { type: Number, default: 0, index: true },
    hourlyRate: { type: Number, default: 0, index: true },
    consultationFee: { type: Number, default: 0 },
    ratingAvg: { type: Number, default: 0, index: true },
    ratingCount: { type: Number, default: 0 },
    totalConsultations: { type: Number, default: 0 },
    bio: { type: String, default: "" },
    profileImage: { type: String, default: "" },
    isFeatured: { type: Boolean, default: false, index: true },
    featuredUntil: { type: Date, default: null },
    verificationStatus: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING", index: true },
    verificationNotes: { type: String, default: "" },
    verifiedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export default mongoose.model("LawyerProfile", LawyerProfileSchema);
