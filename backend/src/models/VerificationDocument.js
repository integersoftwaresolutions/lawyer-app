import mongoose from "mongoose";

const VerificationDocumentSchema = new mongoose.Schema(
  {
    lawyerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    documentType: { 
      type: String, 
      enum: ["BAR_LICENSE", "GOVERNMENT_ID", "PROFESSIONAL_CERTIFICATE", "OTHER"], 
      required: true 
    },
    documentUrl: { type: String, required: true },
    fileName: { type: String, default: "" },
    status: { 
      type: String, 
      enum: ["PENDING", "APPROVED", "REJECTED"], 
      default: "PENDING" 
    },
    adminNotes: { type: String, default: "" },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
  },
  { timestamps: true }
);

export default mongoose.model("VerificationDocument", VerificationDocumentSchema);
