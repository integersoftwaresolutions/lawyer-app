import mongoose from "mongoose";
import { DOCUMENT_VISIBILITY, RAG_INGESTION_STATUS } from "../config/constants.js";

/**
 * Workspace-scoped legal document (briefs, contracts, evidence).
 * RAG chunks live in RagChunk; Pinecone namespace is per-workspace (or public).
 * caseId reserved for Phase 2 matter attachment.
 */
const LegalDocumentSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true
    },
    uploadedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    visibility: {
      type: String,
      enum: Object.values(DOCUMENT_VISIBILITY),
      default: DOCUMENT_VISIBILITY.PRIVATE,
      index: true
    },
    /** Phase 2: attach to a matter Case. */
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Case",
      default: null,
      index: true
    },

    title: { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String, default: "", trim: true, maxlength: 2000 },
    caseRef: { type: String, default: "", trim: true, maxlength: 200, index: true },
    tags: { type: [String], default: [] },

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

    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

LegalDocumentSchema.index({ workspaceId: 1, isDeleted: 1, updatedAt: -1 });
LegalDocumentSchema.index({ workspaceId: 1, visibility: 1, isDeleted: 1 });
LegalDocumentSchema.index({ uploadedByUserId: 1, isDeleted: 1 });

export default mongoose.model("LegalDocument", LegalDocumentSchema);
