import mongoose from "mongoose";
import { RAG_SOURCE_TYPES } from "../config/constants.js";

/**
 * A single text chunk indexed into the vector store.
 *
 * The actual embedding lives in Pinecone (the chunk's `_id` is used as the
 * Pinecone vector id). This Mongo doc holds the text, denormalised metadata
 * for fast UI rendering, and pointers back to the originating source row
 * (CaseLaw or LegalDocument).
 */
const RagChunkSchema = new mongoose.Schema(
  {
    sourceType: {
      type: String,
      enum: Object.values(RAG_SOURCE_TYPES),
      required: true,
      index: true
    },
    /** ObjectId in CaseLaw or LegalDocument depending on sourceType. */
    sourceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },

    /** Pinecone namespace this chunk lives in (e.g. "case-law" or "lawyer:<id>"). */
    namespace: { type: String, required: true, index: true },

    chunkIndex: { type: Number, required: true },
    text: { type: String, required: true },
    charStart: { type: Number, default: 0 },
    charEnd: { type: Number, default: 0 },
    approxTokens: { type: Number, default: 0 },

    /** Denormalised metadata — also pushed to Pinecone metadata for filterable retrieval. */
    metadata: {
      court: { type: String, default: "" },
      year: { type: Number, default: null },
      caseReference: { type: String, default: "" },
      citation: { type: String, default: "" },
      subject: { type: String, default: "" },
      title: { type: String, default: "" },
      sourceUrl: { type: String, default: "" },
      ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      caseRef: { type: String, default: "" },
      tags: { type: [String], default: [] }
    },

    embeddingModel: { type: String, default: "" },
    embeddingDimensions: { type: Number, default: 0 },

    isDeleted: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

RagChunkSchema.index({ sourceType: 1, sourceId: 1, chunkIndex: 1 }, { unique: true });
RagChunkSchema.index({ namespace: 1, "metadata.court": 1, "metadata.year": 1 });
RagChunkSchema.index({ namespace: 1, "metadata.ownerUserId": 1 });

export default mongoose.model("RagChunk", RagChunkSchema);
