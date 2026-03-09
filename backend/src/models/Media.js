import mongoose from "mongoose";

/**
 * Unified Media Model
 * 
 * Central model for all file types in the system:
 * - Verification documents
 * - Profile images
 * - Attachments
 * - Future media types
 * 
 * All file references should use this model via ObjectId.
 * No raw file paths should be stored directly in other models.
 */
const MediaSchema = new mongoose.Schema(
  {
    // File identification
    fileName: { type: String, required: true },
    originalFileName: { type: String, required: true },
    
    // Storage information
    storageKey: { type: String, required: true, unique: true, index: true }, // Unique key in storage (path/key)
    storageProvider: { 
      type: String, 
      enum: ["local", "s3"], 
      default: "local",
      required: true 
    },
    
    // File metadata
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true }, // in bytes
    fileExtension: { type: String, default: "" },
    
    // Access information
    url: { type: String, required: true }, // Public or private URL
    isPublic: { type: Boolean, default: true }, // For future S3 public/private distinction
    
    // Categorization
    mediaType: {
      type: String,
      enum: [
        "VERIFICATION_DOCUMENT",
        "PROFILE_IMAGE",
        "ATTACHMENT",
        "OTHER"
      ],
      required: true,
      index: true
    },
    
    // Related entity information
    uploadedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      index: true 
    },
    relatedEntityType: { 
      type: String, 
      enum: ["User", "VerificationDocument", "LawyerProfile", "ClientProfile", "Message", "Other"],
      default: "Other"
    },
    relatedEntityId: { 
      type: mongoose.Schema.Types.ObjectId,
      index: true
    },
    
    // Additional metadata (flexible for different use cases)
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {}
    },
    
    // Status
    isActive: { type: Boolean, default: true, index: true },
    deletedAt: { type: Date, default: null }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for common queries
MediaSchema.index({ uploadedBy: 1, mediaType: 1 });
MediaSchema.index({ relatedEntityType: 1, relatedEntityId: 1 });
MediaSchema.index({ isActive: 1, deletedAt: 1 });

// Virtual for file size in human-readable format
MediaSchema.virtual("fileSizeFormatted").get(function() {
  const bytes = this.fileSize;
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
});

export default mongoose.model("Media", MediaSchema);

