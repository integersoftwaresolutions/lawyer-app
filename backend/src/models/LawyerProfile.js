import mongoose from "mongoose";

const LawyerProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true, index: true, required: true },
    fullName: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    whatsapp: { type: String, default: "" },
    city: { type: String, index: true, default: "" },
    officeAddress: { type: String, default: "" },
    // Pakistani-specific fields
    cnic: { type: String, default: "" }, // CNIC number
    barCouncilNumber: { type: String, default: "" }, // Bar Council registration number
    barCouncil: { type: String, default: "" }, // Which bar council (e.g., "Punjab Bar Council", "Sindh Bar Council")
    // Professional details
    specialization: { type: [String], index: true, default: [] },
    languages: { type: [String], default: ["English", "Urdu"] },
    experienceYears: { type: Number, default: 0, index: true },
    hourlyRate: { type: Number, default: 0, index: true },
    consultationFee: { type: Number, default: 0 },
    // Ratings and stats
    ratingAvg: { type: Number, default: 0, index: true },
    ratingCount: { type: Number, default: 0 },
    totalConsultations: { type: Number, default: 0 },
    bio: { type: String, default: "" },
    profileImage: { type: String, default: "" },
    // Featured status
    isFeatured: { type: Boolean, default: false, index: true },
    featuredUntil: { type: Date, default: null },
    // Verification
    verificationStatus: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING", index: true },
    verificationNotes: { type: String, default: "" },
    verifiedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export default mongoose.model("LawyerProfile", LawyerProfileSchema);
