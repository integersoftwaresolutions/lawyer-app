import { ragConfig, getWorkspaceNamespace, getPublicDocumentsNamespace, isPineconeConfigured } from "../../config/rag.config.js";
import { RAG_SOURCE_TYPES } from "../../config/constants.js";
import RagChunk from "../../models/RagChunk.js";
import * as embeddingService from "./embedding.service.js";
import * as vectorStore from "./vectorStore/index.js";

/**
 * Semantic search across case-law, public lawyer docs, and active workspace docs.
 */
export async function retrieveContext({
  query,
  lawyerId,
  workspaceId,
  topK,
  minScore,
  filters = {},
  includeLawyerDocuments = true
}) {
  const trimmed = String(query || "").trim();
  if (!trimmed) return emptyResult();

  const effectiveTopK = topK ?? ragConfig.topK;
  const workspaceNamespace =
    includeLawyerDocuments && workspaceId ? getWorkspaceNamespace(workspaceId) : null;

  const namespaces = [
    {
      name: ragConfig.pinecone.caseLawNamespace,
      filter: buildCaseLawFilter(filters),
      minScore: minScore ?? ragConfig.minScore
    },
    {
      name: getPublicDocumentsNamespace(),
      filter: {},
      minScore: minScore ?? ragConfig.privateDocumentMinScore
    }
  ];

  if (workspaceNamespace) {
    namespaces.push({
      name: workspaceNamespace,
      filter: buildLawyerDocFilter(filters),
      minScore: minScore ?? ragConfig.privateDocumentMinScore
    });
  }

  const semanticMatches = await retrieveSemanticMatches({
    query: trimmed,
    lawyerId,
    namespaces,
    topK: effectiveTopK
  });
  const rawTopScore = semanticMatches.reduce(
    (best, match) => Math.max(best, Number(match.score) || 0),
    0
  );

  const acceptedSemantic = semanticMatches.filter(
    (match) => typeof match.score === "number" && match.score >= match.minScore
  );

  const lexicalMatches = workspaceNamespace
    ? await retrievePrivateDocumentLexicalMatches({
        query: trimmed,
        namespace: workspaceNamespace,
        filters,
        topK: effectiveTopK
      })
    : [];

  const candidates = mergeCandidates(acceptedSemantic, lexicalMatches, semanticMatches)
    .sort((a, b) => b.rankScore - a.rankScore)
    .slice(0, effectiveTopK);

  if (candidates.length === 0) {
    return emptyResult({
      rawMatchCount: semanticMatches.length,
      topScore: rawTopScore,
      semanticMatchCount: acceptedSemantic.length,
      lexicalMatchCount: lexicalMatches.length
    });
  }

  const chunkIds = candidates.map((candidate) => candidate.id);
  const chunkRows = await RagChunk.find({
    _id: { $in: chunkIds },
    namespace: { $in: namespaces.map((item) => item.name) },
    isDeleted: false
  }).lean();
  const byId = new Map(chunkRows.map((row) => [String(row._id), row]));

  const blocks = [];
  const citations = [];
  let usedChars = 0;

  for (const candidate of candidates) {
    const row = byId.get(String(candidate.id));
    if (!row) continue;

    const formatted = formatBlock(row, candidate, blocks.length + 1);
    if (usedChars + formatted.text.length > ragConfig.maxContextChars) break;

    blocks.push(formatted.text);
    citations.push(formatted.citation);
    usedChars += formatted.text.length;
  }

  return {
    blocks,
    citations,
    matchCount: blocks.length,
    topScore: rawTopScore,
    rawMatchCount: semanticMatches.length,
    semanticMatchCount: candidates.filter((item) => item.methods.includes("semantic")).length,
    lexicalMatchCount: candidates.filter((item) => item.methods.includes("lexical")).length
  };
}

function emptyResult(overrides = {}) {
  return {
    blocks: [],
    citations: [],
    matchCount: 0,
    topScore: 0,
    rawMatchCount: 0,
    semanticMatchCount: 0,
    lexicalMatchCount: 0,
    ...overrides
  };
}

async function retrieveSemanticMatches({ query, lawyerId, namespaces, topK }) {
  if (!isPineconeConfigured()) return [];

  try {
    const { embedding } = await embeddingService.embedQuery(query, {
      userId: lawyerId,
      metadata: { source: "retrieval" }
    });
    if (!embedding || embedding.length === 0) return [];

    const matchesByNamespace = await Promise.all(
      namespaces.map(async ({ name, filter, minScore }) => {
        try {
          const matches = await vectorStore.query(name, embedding, { topK, filter });
          return matches.map((match) => ({ ...match, namespace: name, minScore }));
        } catch (error) {
          if (error?.status === 404 || /not found/i.test(error?.message || "")) return [];
          throw error;
        }
      })
    );

    return matchesByNamespace.flat();
  } catch (error) {
    // Lexical private-document retrieval can still answer factual questions
    // while the embedding provider or vector store is temporarily unavailable.
    console.error("[rag] Semantic retrieval failed:", error.message);
    return [];
  }
}

const QUERY_STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "been", "by", "did", "do",
  "does", "for", "from", "had", "has", "have", "how", "in", "into", "is",
  "it", "its", "of", "on", "or", "that", "the", "their", "there", "these",
  "this", "those", "to", "was", "were", "what", "when", "where", "which",
  "who", "why", "with", "would", "two"
]);

async function retrievePrivateDocumentLexicalMatches({
  query,
  namespace,
  filters,
  topK
}) {
  const terms = extractQueryTerms(query);
  if (terms.length === 0) return [];

  const mongoFilter = {
    namespace,
    sourceType: RAG_SOURCE_TYPES.LEGAL_DOCUMENT,
    isDeleted: false,
    ...buildLawyerMongoFilter(filters),
    $or: terms.map((term) => ({ text: buildTermRegex(term) }))
  };

  const rows = await RagChunk.find(mongoFilter)
    .limit(Math.max(topK * 10, 50))
    .lean();

  return rows
    .map((row) => {
      const matchedTerms = terms.filter((term) => buildTermRegex(term).test(row.text));
      return {
        id: String(row._id),
        namespace,
        lexicalScore: matchedTerms.length / terms.length,
        matchedTerms: matchedTerms.length
      };
    })
    .filter((match) => match.matchedTerms > 0)
    .sort((a, b) => {
      if (b.matchedTerms !== a.matchedTerms) return b.matchedTerms - a.matchedTerms;
      return b.lexicalScore - a.lexicalScore;
    })
    .slice(0, topK);
}

function extractQueryTerms(query) {
  const words = String(query || "")
    .toLowerCase()
    .match(/[\p{L}\p{N}][\p{L}\p{N}'-]{1,}/gu) || [];

  return [...new Set(words.filter((word) => word.length >= 3 && !QUERY_STOP_WORDS.has(word)))]
    .slice(0, 10);
}

function buildTermRegex(term) {
  const variants = new Set([term]);
  if (term.endsWith("ies") && term.length > 4) {
    variants.add(`${term.slice(0, -3)}y`);
  } else if (term.endsWith("es") && term.length > 4) {
    variants.add(term.slice(0, -2));
  } else if (term.endsWith("s") && term.length > 3) {
    variants.add(term.slice(0, -1));
  }

  const pattern = [...variants].map(escapeRegExp).join("|");
  return new RegExp(`\\b(?:${pattern})\\b`, "i");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildLawyerMongoFilter(filters = {}) {
  const out = {};
  if (filters.caseRef) out["metadata.caseRef"] = filters.caseRef;
  if (filters.tag) out["metadata.tags"] = filters.tag;
  return out;
}

function mergeCandidates(semanticAccepted, lexicalMatches, allSemanticMatches) {
  const byId = new Map();
  const rawSemanticById = new Map(
    allSemanticMatches.map((match) => [String(match.id), Number(match.score) || 0])
  );

  for (const match of semanticAccepted) {
    const id = String(match.id);
    byId.set(id, {
      id,
      semanticScore: Number(match.score) || 0,
      lexicalScore: 0,
      methods: ["semantic"]
    });
  }

  for (const match of lexicalMatches) {
    const id = String(match.id);
    const existing = byId.get(id);
    const lexicalScore = Number(match.lexicalScore) || 0;

    if (existing) {
      existing.lexicalScore = Math.max(existing.lexicalScore, lexicalScore);
      if (!existing.methods.includes("lexical")) existing.methods.push("lexical");
    } else {
      byId.set(id, {
        id,
        semanticScore: rawSemanticById.get(id) || 0,
        lexicalScore,
        methods: ["lexical"]
      });
    }
  }

  return [...byId.values()].map((candidate) => ({
    ...candidate,
    // Lexical coverage complements, rather than replaces, cosine similarity.
    rankScore: candidate.semanticScore + candidate.lexicalScore * 0.25
  }));
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

function formatBlock(row, candidate, displayIndex) {
  const meta = row.metadata || {};
  const isCaseLaw = row.sourceType === RAG_SOURCE_TYPES.CASE_LAW;
  const heading = isCaseLaw
    ? formatCaseLawHeading(meta)
    : formatDocumentHeading(meta);
  const semanticScore = candidate.semanticScore || 0;
  const retrievalLabel = candidate.methods.join("+");

  const text = `[${displayIndex}] ${heading}\nRetrieval: ${retrievalLabel}${
    semanticScore ? ` · similarity ${semanticScore.toFixed(3)}` : ""
  }\n${row.text}`.trim();

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
        score: candidate.rankScore,
        semanticScore,
        retrievalMethods: candidate.methods
      }
    : {
        index: displayIndex,
        sourceType: RAG_SOURCE_TYPES.LEGAL_DOCUMENT,
        chunkId: String(row._id),
        sourceId: String(row.sourceId),
        title: meta.title || "",
        caseRef: meta.caseRef || "",
        excerpt: row.text.length > 320 ? `${row.text.slice(0, 320).trim()}…` : row.text,
        score: candidate.rankScore,
        semanticScore,
        retrievalMethods: candidate.methods
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
