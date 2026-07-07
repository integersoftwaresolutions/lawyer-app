import mongoose from "mongoose";
import { RAG_INGESTION_STATUS } from "../config/constants.js";

/**
 * A document uploaded by a lawyer (brief, contract, evidence, notes) that is
 * ingested into the RAG corpus under their private namespace.
 *
 * Stored chunks live in `RagChunk` (sourceType=LEGAL_DOCUMENT, sourceId=this._id).
 * Owned by a single lawyer — never shared across lawyers (Section 7.2).
 */
const LegalDocumentSchema = new mongoose.Schema(
  {
    ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String, default: "", trim: true, maxlength: 2000 },
    caseRef: { type: String, default: "", trim: true, maxlength: 200, index: true },
    tags: { type: [String], default: [] },

    /** Optional pointer to the underlying file via the unified Media model. */
    mediaId: { type: mongoose.Schema.Types.ObjectId, ref: "Media", default: null },

    rawText: { type: String, default: "" },
    rawTextChars: { type: Number, default: 0 },

    chunkCount: { type: Number, default: 0 },
    embeddingModel: { type: String, default: "" },

    status: {
      type: String,
      enum: Object.values(RAG_INGESTION_STATUS),
      default: RAG_INGESTION_STATUS.PENDING,
      index: true
    },
    statusMessage: { type: String, default: "" },
    indexedAt: { type: Date, default: null },

    isDeleted: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

LegalDocumentSchema.index({ ownerUserId: 1, isDeleted: 1, updatedAt: -1 });

export default mongoose.model("LegalDocument", LegalDocumentSchema);
