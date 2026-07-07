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
  topK: env.ragTopK,
  minScore: env.ragMinScore,
  // Per-lawyer documents are stored under the namespace `lawyer:<userId>`
  lawyerNamespacePrefix: "lawyer:",
  // Maximum characters of context blocks injected into the LLM prompt.
  maxContextChars: 8000
};

export function isPineconeConfigured() {
  return Boolean(ragConfig.pinecone.apiKey && ragConfig.pinecone.indexName);
}

export function getLawyerNamespace(lawyerId) {
  return `${ragConfig.lawyerNamespacePrefix}${lawyerId}`;
}
