import mongoose from "mongoose";
import { PAKISTANI_COURTS, RAG_INGESTION_STATUS } from "../config/constants.js";

/**
 * A single Pakistani case-law judgment ingested into the RAG corpus.
 *
 * Lifecycle:
 *   PENDING -> PROCESSING -> INDEXED (or FAILED)
 *
 * The actual chunked text lives in `RagChunk` (sourceType=CASE_LAW, sourceId=this._id).
 */
const CaseLawSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 500 },
    court: {
      type: String,
      enum: PAKISTANI_COURTS,
      required: true,
      index: true
    },
    year: { type: Number, required: true, index: true, min: 1900, max: 2100 },
    caseReference: { type: String, default: "", trim: true, maxlength: 200, index: true },
    citation: { type: String, default: "", trim: true, maxlength: 300 },
    subject: { type: String, default: "", trim: true, maxlength: 200, index: true },
    judges: { type: [String], default: [] },
    decisionDate: { type: Date, default: null },

    sourceUrl: { type: String, default: "", trim: true, maxlength: 1000 },
    sourceProvider: { type: String, default: "", trim: true, maxlength: 100 },
    sourceHash: { type: String, default: "", index: true, maxlength: 64 },

    /** Cleaned plaintext used for chunking. Stored for re-chunking / debugging. */
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

    isPublic: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

CaseLawSchema.index({ court: 1, year: -1 });
CaseLawSchema.index({ status: 1, isDeleted: 1 });

export default mongoose.model("CaseLaw", CaseLawSchema);
