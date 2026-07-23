import crypto from "crypto";
import { ApiError } from "../../../helpers/apiError.js";
import { RAG_INGESTION_STATUS, RAG_SOURCE_TYPES } from "../../../config/constants.js";
import { ragConfig, getLawyerNamespace } from "../../../config/rag.config.js";
import CaseLaw from "../../../models/CaseLaw.js";
import LegalDocument from "../../../models/LegalDocument.js";
import RagChunk from "../../../models/RagChunk.js";
import { chunkText, normalizeText } from "../chunker.js";
import * as embeddingService from "../embedding.service.js";
import * as vectorStore from "../vectorStore/index.js";

/**
 * Ingest a Pakistani case-law judgment.
 *
 * 1. Upsert / re-use a CaseLaw row.
 * 2. Replace any prior chunks (Mongo + Pinecone) for that source.
 * 3. Chunk the cleaned text.
 * 4. Embed each chunk.
 * 5. Upsert vectors to Pinecone (case-law namespace).
 * 6. Persist RagChunk rows.
 *
 * Idempotent: re-ingesting with the same `sourceUrl` will replace existing chunks.
 */
export async function ingestCaseLaw(input, options = {}) {
  validateCaseLawInput(input);

  const text = normalizeText(input.text);
  if (!text) throw new ApiError(400, "Case-law text is required after normalisation");

  const sourceHash = hashText(text);
  const filter = input._id
    ? { _id: input._id }
    : input.sourceUrl
      ? { sourceUrl: input.sourceUrl }
      : { title: input.title, court: input.court, year: input.year };

  let caseLaw = await CaseLaw.findOneAndUpdate(
    filter,
    {
      $set: {
        title: input.title,
        court: input.court,
        year: input.year,
        caseReference: input.caseReference || "",
        citation: input.citation || "",
        subject: input.subject || "",
        judges: input.judges || [],
        decisionDate: input.decisionDate || null,
        sourceUrl: input.sourceUrl || "",
        sourceProvider: input.sourceProvider || "",
        sourceHash,
        rawText: text,
        rawTextChars: text.length,
        status: RAG_INGESTION_STATUS.PROCESSING,
        statusMessage: "",
        isDeleted: false
      }
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  try {
    const namespace = ragConfig.pinecone.caseLawNamespace;
    const chunks = chunkText(text);
    if (chunks.length === 0) throw new ApiError(400, "No chunks produced from input text");

    await deleteExistingChunks(RAG_SOURCE_TYPES.CASE_LAW, caseLaw._id, namespace);

    const baseMetadata = {
      court: caseLaw.court,
      year: caseLaw.year,
      caseReference: caseLaw.caseReference,
      citation: caseLaw.citation,
      subject: caseLaw.subject,
      title: caseLaw.title,
      sourceUrl: caseLaw.sourceUrl
    };

    const embedded = await embedChunks(chunks, options);

    const persisted = await persistChunks({
      sourceType: RAG_SOURCE_TYPES.CASE_LAW,
      sourceId: caseLaw._id,
      namespace,
      chunks,
      embeddings: embedded.embeddings,
      embeddingModel: embedded.model,
      baseMetadata
    });

    caseLaw.chunkCount = persisted.length;
    caseLaw.embeddingModel = embedded.model;
    caseLaw.status = RAG_INGESTION_STATUS.INDEXED;
    caseLaw.indexedAt = new Date();
    await caseLaw.save();

    return {
      caseLawId: caseLaw._id,
      chunkCount: persisted.length,
      embeddingModel: embedded.model,
      namespace
    };
  } catch (err) {
    caseLaw.status = RAG_INGESTION_STATUS.FAILED;
    caseLaw.statusMessage = err.message?.slice(0, 500) || "Ingestion failed";
    await caseLaw.save();
    throw err;
  }
}

/**
 * Ingest a lawyer-uploaded document into their private namespace.
 */
export async function ingestLegalDocument(input, options = {}) {
  if (!input.ownerUserId) throw new ApiError(400, "ownerUserId is required");
  if (!input.title) throw new ApiError(400, "title is required");
  if (!input.text && !input.buffer) throw new ApiError(400, "text or buffer is required");

  let text = input.text || "";
  if (!text && input.buffer) {
    const { extractText } = await import("./textExtractor.js");
    text = await extractText({
      buffer: input.buffer,
      mimeType: input.mimeType,
      fileName: input.fileName
    });
  }

  text = normalizeText(text);
  if (!text) throw new ApiError(400, "Document produced no extractable text");

  const filter = input._id
    ? { _id: input._id }
    : { ownerUserId: input.ownerUserId, title: input.title };

  let doc = await LegalDocument.findOneAndUpdate(
    filter,
    {
      $set: {
        ownerUserId: input.ownerUserId,
        title: input.title,
        description: input.description || "",
        caseRef: input.caseRef || "",
        tags: input.tags || [],
        mediaId: input.mediaId || null,
        rawText: text,
        rawTextChars: text.length,
        status: RAG_INGESTION_STATUS.PROCESSING,
        statusMessage: "",
        isDeleted: false
      }
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  try {
    const namespace = getLawyerNamespace(input.ownerUserId);
    const chunks = chunkText(text, {
      chunkSizeTokens: ragConfig.privateDocumentChunkSizeTokens,
      chunkOverlapTokens: ragConfig.privateDocumentChunkOverlapTokens
    });
    if (chunks.length === 0) throw new ApiError(400, "No chunks produced from document");

    await deleteExistingChunks(RAG_SOURCE_TYPES.LEGAL_DOCUMENT, doc._id, namespace);

    const baseMetadata = {
      title: doc.title,
      caseRef: doc.caseRef,
      ownerUserId: doc.ownerUserId,
      tags: doc.tags
    };

    const embedded = await embedChunks(chunks, { ...options, userId: options.userId || doc.ownerUserId });

    const persisted = await persistChunks({
      sourceType: RAG_SOURCE_TYPES.LEGAL_DOCUMENT,
      sourceId: doc._id,
      namespace,
      chunks,
      embeddings: embedded.embeddings,
      embeddingModel: embedded.model,
      baseMetadata
    });

    doc.chunkCount = persisted.length;
    doc.embeddingModel = embedded.model;
    doc.status = RAG_INGESTION_STATUS.INDEXED;
    doc.indexedAt = new Date();
    await doc.save();

    return {
      documentId: doc._id,
      chunkCount: persisted.length,
      embeddingModel: embedded.model,
      namespace
    };
  } catch (err) {
    doc.status = RAG_INGESTION_STATUS.FAILED;
    doc.statusMessage = err.message?.slice(0, 500) || "Ingestion failed";
    await doc.save();
    throw err;
  }
}

/** Soft-delete a case-law row and remove its vectors from Pinecone. */
export async function deleteCaseLaw(caseLawId) {
  const row = await CaseLaw.findById(caseLawId);
  if (!row) throw new ApiError(404, "Case-law not found");

  await deleteExistingChunks(RAG_SOURCE_TYPES.CASE_LAW, row._id, ragConfig.pinecone.caseLawNamespace);
  row.isDeleted = true;
  row.chunkCount = 0;
  await row.save();
  return { caseLawId: row._id };
}

/** Soft-delete a legal document and remove its vectors. */
export async function deleteLegalDocument(documentId, ownerUserId) {
  const row = await LegalDocument.findOne({ _id: documentId, ownerUserId, isDeleted: false });
  if (!row) throw new ApiError(404, "Document not found");

  const namespace = getLawyerNamespace(row.ownerUserId);
  await deleteExistingChunks(RAG_SOURCE_TYPES.LEGAL_DOCUMENT, row._id, namespace);
  row.isDeleted = true;
  row.chunkCount = 0;
  await row.save();
  return { documentId: row._id };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function validateCaseLawInput(input) {
  if (!input) throw new ApiError(400, "Case-law input is required");
  if (!input.title) throw new ApiError(400, "title is required");
  if (!input.court) throw new ApiError(400, "court is required");
  if (!input.year) throw new ApiError(400, "year is required");
  if (!input.text) throw new ApiError(400, "text is required");
}

function hashText(text) {
  return crypto.createHash("sha256").update(text).digest("hex").slice(0, 32);
}

async function embedChunks(chunks, options) {
  return embeddingService.embedTexts(
    chunks.map((c) => c.text),
    {
      userId: options?.userId,
      metadata: { source: "ingestion", chunkCount: chunks.length, ...(options?.metadata || {}) }
    }
  );
}

async function deleteExistingChunks(sourceType, sourceId, namespace) {
  const existing = await RagChunk.find({ sourceType, sourceId }).select("_id").lean();
  if (existing.length === 0) return;
  const ids = existing.map((c) => String(c._id));
  await vectorStore.deleteByIds(namespace, ids).catch(() => {
    /* swallow — Pinecone returns 404 when ids are absent on serverless */
  });
  await RagChunk.deleteMany({ _id: { $in: ids } });
}

async function persistChunks({
  sourceType,
  sourceId,
  namespace,
  chunks,
  embeddings,
  embeddingModel,
  baseMetadata
}) {
  if (chunks.length !== embeddings.length) {
    throw new ApiError(500, `Embedding count mismatch (got ${embeddings.length} for ${chunks.length} chunks)`);
  }
  for (let i = 0; i < embeddings.length; i++) {
    if (!Array.isArray(embeddings[i]) || embeddings[i].length === 0) {
      throw new ApiError(500, `Embedding for chunk ${i} is empty or invalid`);
    }
  }

  const docs = chunks.map((c, i) => ({
    sourceType,
    sourceId,
    namespace,
    chunkIndex: c.index,
    text: c.text,
    charStart: c.charStart,
    charEnd: c.charEnd,
    approxTokens: c.approxTokens,
    metadata: { ...baseMetadata },
    embeddingModel,
    embeddingDimensions: embeddings[i]?.length || 0
  }));

  const inserted = await RagChunk.insertMany(docs);

  const vectors = inserted.map((row, i) => ({
    id: String(row._id),
    values: embeddings[i],
    metadata: {
      sourceType,
      sourceId: String(sourceId),
      chunkIndex: row.chunkIndex,
      charStart: row.charStart,
      charEnd: row.charEnd,
      ...flattenForPinecone(baseMetadata)
    }
  }));

  await vectorStore.upsert(namespace, vectors);
  return inserted;
}

function flattenForPinecone(meta = {}) {
  const out = {};
  for (const [k, v] of Object.entries(meta)) {
    if (v === null || v === undefined) continue;
    if (v instanceof Date) out[k] = v.toISOString();
    else if (Array.isArray(v)) out[k] = v.map(String);
    else if (typeof v === "object") out[k] = JSON.stringify(v);
    else out[k] = v;
  }
  return out;
}
