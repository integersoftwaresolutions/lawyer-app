import { ApiError } from "../../../helpers/apiError.js";
import { isPineconeConfigured } from "../../../config/rag.config.js";
import { pineconeDriver } from "./pinecone.driver.js";

/**
 * Thin abstraction over the underlying vector database.
 *
 * Drivers must implement:
 *   - upsert(namespace, items)  // items: [{ id, values, metadata }]
 *   - query(namespace, vector, { topK, filter })
 *   - deleteByIds(namespace, ids)
 *   - deleteByFilter(namespace, filter)
 *   - deleteNamespace(namespace)
 *
 * Swap drivers by changing this export only — the rest of the app is decoupled.
 */
const driver = pineconeDriver;

export function ensureVectorStoreConfigured() {
  if (!isPineconeConfigured()) {
    throw new ApiError(503, "Vector store is not configured. Set PINECONE_API_KEY and PINECONE_INDEX.");
  }
}

export async function upsert(namespace, items) {
  ensureVectorStoreConfigured();
  if (!Array.isArray(items) || items.length === 0) return { upsertedCount: 0 };
  return driver.upsert(namespace, items);
}

export async function query(namespace, vector, options = {}) {
  ensureVectorStoreConfigured();
  return driver.query(namespace, vector, options);
}

export async function deleteByIds(namespace, ids) {
  ensureVectorStoreConfigured();
  if (!Array.isArray(ids) || ids.length === 0) return { deletedCount: 0 };
  return driver.deleteByIds(namespace, ids);
}

export async function deleteByFilter(namespace, filter) {
  ensureVectorStoreConfigured();
  return driver.deleteByFilter(namespace, filter);
}

export async function deleteNamespace(namespace) {
  ensureVectorStoreConfigured();
  return driver.deleteNamespace(namespace);
}

export { isPineconeConfigured };
