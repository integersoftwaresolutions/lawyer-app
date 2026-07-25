import { env } from "./env.js";

export const ragConfig = {
  pinecone: {
    apiKey: env.pineconeApiKey,
    indexName: env.pineconeIndex,
    caseLawNamespace: env.pineconeCaseLawNamespace
  },
  embeddingDimensions: env.ragEmbeddingDimensions,
  chunkSizeTokens: env.ragChunkSizeTokens,
  chunkOverlapTokens: env.ragChunkOverlapTokens,
  privateDocumentChunkSizeTokens: env.ragPrivateDocumentChunkSizeTokens,
  privateDocumentChunkOverlapTokens: env.ragPrivateDocumentChunkOverlapTokens,
  topK: env.ragTopK,
  // Shared case-law needs a conservative cutoff; private documents can use a
  // lower floor because their namespace is already scoped to one lawyer.
  minScore: env.ragMinScore,
  privateDocumentMinScore: env.ragPrivateDocumentMinScore,
  // Workspace-private/firm docs: `workspace:<workspaceId>`
  workspaceNamespacePrefix: "workspace:",
  // Lawyer-uploaded PUBLIC docs (shared corpus, parallel to case-law)
  publicDocumentsNamespace: "public-documents",
  // Maximum characters of context blocks injected into the LLM prompt.
  maxContextChars: 8000
};

export function isPineconeConfigured() {
  return Boolean(ragConfig.pinecone.apiKey && ragConfig.pinecone.indexName);
}

/** @deprecated Prefer getWorkspaceNamespace — kept for any leftover refs during migration. */
export function getLawyerNamespace(lawyerId) {
  return `lawyer:${lawyerId}`;
}

export function getWorkspaceNamespace(workspaceId) {
  return `${ragConfig.workspaceNamespacePrefix}${workspaceId}`;
}

export function getPublicDocumentsNamespace() {
  return ragConfig.publicDocumentsNamespace;
}
