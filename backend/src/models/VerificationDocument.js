import mongoose from "mongoose";

const VerificationDocumentSchema = new mongoose.Schema(
  {
    lawyerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    documentType: { 
      type: String, 
      enum: ["BAR_LICENSE", "GOVERNMENT_ID", "PROFESSIONAL_CERTIFICATE", "OTHER"], 
      required: true 
    },
    // Reference to Media model instead of storing raw URL
    // Optional for backward compatibility with existing records
    mediaId: { type: mongoose.Schema.Types.ObjectId, ref: "Media", default: null },
    // Legacy fields for backward compatibility (will be populated from Media if mediaId exists)
    documentUrl: { type: String, default: "" },
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

// Virtual to populate media and get URL
VerificationDocumentSchema.virtual("media", {
  ref: "Media",
  localField: "mediaId",
  foreignField: "_id",
  justOne: true
});

// Pre-save hook to sync legacy fields from Media (for backward compatibility)
VerificationDocumentSchema.pre("save", async function() {
  if (this.isNew || this.isModified("mediaId")) {
    if (this.mediaId) {
      try {
        const Media = mongoose.model("Media");
        const media = await Media.findById(this.mediaId);
        if (media) {
          this.documentUrl = media.url;
          this.fileName = media.originalFileName;
        }
      } catch (error) {
        // If Media model not available or error, skip sync
        console.warn("Failed to sync Media fields:", error.message);
      }
    }
  }
});

export default mongoose.model("VerificationDocument", VerificationDocumentSchema);
