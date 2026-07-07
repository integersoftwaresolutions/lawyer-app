import { ragConfig, getLawyerNamespace, isPineconeConfigured } from "../../config/rag.config.js";
import { RAG_SOURCE_TYPES } from "../../config/constants.js";
import RagChunk from "../../models/RagChunk.js";
import * as embeddingService from "./embedding.service.js";
import * as vectorStore from "./vectorStore/index.js";

/**
 * Run a semantic search across the case-law corpus and (optionally) the
 * lawyer's private documents. Returns a normalised list of "context blocks"
 * ready to be injected into the LLM prompt, plus citation metadata for
 * surfacing in the UI.
 *
 * The lookup is best-effort: if the vector store is not configured we return
 * an empty result so the chat path keeps working without RAG.
 */
export async function retrieveContext({
  query,
  lawyerId,
  topK,
  minScore,
  filters = {},
  includeLawyerDocuments = true
}) {
  const trimmed = String(query || "").trim();
  if (!trimmed) return emptyResult();
  if (!isPineconeConfigured()) return emptyResult();

  const effectiveTopK = topK ?? ragConfig.topK;
  const effectiveMinScore = minScore ?? ragConfig.minScore;

  const { embedding } = await embeddingService.embedQuery(trimmed, { userId: lawyerId, metadata: { source: "retrieval" } });
  if (!embedding || embedding.length === 0) return emptyResult();

  const namespaces = [
    {
      name: ragConfig.pinecone.caseLawNamespace,
      filter: buildCaseLawFilter(filters)
    }
  ];

  if (includeLawyerDocuments && lawyerId) {
    namespaces.push({
      name: getLawyerNamespace(lawyerId),
      filter: buildLawyerDocFilter(filters)
    });
  }

  const matchesByNamespace = await Promise.all(
    namespaces.map(async ({ name, filter }) => {
      try {
        return await vectorStore.query(name, embedding, { topK: effectiveTopK, filter });
      } catch (err) {
        if (err?.status === 404 || /not found/i.test(err?.message || "")) return [];
        throw err;
      }
    })
  );

  const allMatches = matchesByNamespace.flat();
  if (allMatches.length === 0) return emptyResult();

  const scored = allMatches
    .filter((m) => typeof m.score === "number" && m.score >= effectiveMinScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, effectiveTopK);

  if (scored.length === 0) return emptyResult();

  const chunkIds = scored.map((m) => m.id);
  const chunkRows = await RagChunk.find({ _id: { $in: chunkIds }, isDeleted: false }).lean();
  const byId = new Map(chunkRows.map((row) => [String(row._id), row]));

  const blocks = [];
  const citations = [];
  let usedChars = 0;

  for (const match of scored) {
    const row = byId.get(String(match.id));
    if (!row) continue;

    const formatted = formatBlock(row, match.score, blocks.length + 1);
    if (usedChars + formatted.text.length > ragConfig.maxContextChars) break;

    blocks.push(formatted.text);
    citations.push(formatted.citation);
    usedChars += formatted.text.length;
  }

  return { blocks, citations, matchCount: scored.length, topScore: scored[0]?.score ?? 0 };
}

function emptyResult() {
  return { blocks: [], citations: [], matchCount: 0, topScore: 0 };
}

function buildCaseLawFilter(filters = {}) {
  const out = {};
  if (filters.court) out.court = Array.isArray(filters.court) ? { $in: filters.court } : filters.court;
  if (filters.subject) out.subject = filters.subject;
  if (filters.yearFrom || filters.yearTo) {
    const range = {};
    if (filters.yearFrom) range.$gte = Number(filters.yearFrom);
    if (filters.yearTo) range.$lte = Number(filters.yearTo);
    out.year = range;
  }
  return out;
}

function buildLawyerDocFilter(filters = {}) {
  const out = {};
  if (filters.caseRef) out.caseRef = filters.caseRef;
  if (filters.tag) out.tags = filters.tag;
  return out;
}

function formatBlock(row, score, displayIndex) {
  const meta = row.metadata || {};
  const isCaseLaw = row.sourceType === RAG_SOURCE_TYPES.CASE_LAW;
  const heading = isCaseLaw
    ? formatCaseLawHeading(meta)
    : formatDocumentHeading(meta);

  const text = `[${displayIndex}] ${heading}\nScore: ${score.toFixed(3)}\n${row.text}`.trim();

  const citation = isCaseLaw
    ? {
        index: displayIndex,
        sourceType: RAG_SOURCE_TYPES.CASE_LAW,
        chunkId: String(row._id),
        sourceId: String(row.sourceId),
        court: meta.court || "",
        year: meta.year || null,
        caseReference: meta.caseReference || "",
        citation: meta.citation || "",
        title: meta.title || "",
        sourceUrl: meta.sourceUrl || "",
        excerpt: row.text.length > 320 ? `${row.text.slice(0, 320).trim()}…` : row.text,
        score
      }
    : {
        index: displayIndex,
        sourceType: RAG_SOURCE_TYPES.LEGAL_DOCUMENT,
        chunkId: String(row._id),
        sourceId: String(row.sourceId),
        title: meta.title || "",
        caseRef: meta.caseRef || "",
        excerpt: row.text.length > 320 ? `${row.text.slice(0, 320).trim()}…` : row.text,
        score
      };

  return { text, citation };
}

function formatCaseLawHeading(meta) {
  const parts = [];
  if (meta.court) parts.push(meta.court);
  if (meta.year) parts.push(meta.year);
  if (meta.caseReference) parts.push(meta.caseReference);
  const left = parts.length ? parts.join(" · ") : "Case law";
  const title = meta.title ? ` — ${meta.title}` : "";
  return `${left}${title}`;
}

function formatDocumentHeading(meta) {
  const title = meta.title || "Lawyer document";
  const caseRef = meta.caseRef ? ` (case: ${meta.caseRef})` : "";
  return `${title}${caseRef}`;
}
