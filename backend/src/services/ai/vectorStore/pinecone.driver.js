import { Pinecone } from "@pinecone-database/pinecone";
import { ApiError } from "../../../helpers/apiError.js";
import { ragConfig, isPineconeConfigured } from "../../../config/rag.config.js";

let client = null;
let indexHandle = null;

function getClient() {
  if (!isPineconeConfigured()) {
    throw new ApiError(503, "Pinecone is not configured. Set PINECONE_API_KEY and PINECONE_INDEX.");
  }
  if (!client) {
    client = new Pinecone({ apiKey: ragConfig.pinecone.apiKey });
  }
  return client;
}

function getIndex() {
  if (!indexHandle) {
    indexHandle = getClient().index(ragConfig.pinecone.indexName);
  }
  return indexHandle;
}

function ns(namespace) {
  return getIndex().namespace(namespace);
}

/** Pinecone caps at 100 vectors per upsert; chunk to be safe. */
const UPSERT_BATCH = 100;

async function upsert(namespace, items) {
  const target = ns(namespace);
  let upsertedCount = 0;

  for (let i = 0; i < items.length; i += UPSERT_BATCH) {
    const records = items
      .slice(i, i + UPSERT_BATCH)
      .filter((item) => Array.isArray(item.values) && item.values.length > 0)
      .map((item) => ({
        id: String(item.id),
        values: item.values,
        metadata: sanitizeMetadata(item.metadata)
      }));

    if (records.length === 0) continue;

    // Pinecone SDK v7 takes an options object: { records, namespace? }
    await target.upsert({ records });
    upsertedCount += records.length;
  }

  return { upsertedCount };
}

async function query(namespace, vector, { topK = 6, filter, includeMetadata = true } = {}) {
  const target = ns(namespace);
  const result = await target.query({
    vector,
    topK,
    includeValues: false,
    includeMetadata,
    ...(filter && Object.keys(filter).length ? { filter } : {})
  });

  return (result.matches || []).map((m) => ({
    id: m.id,
    score: m.score,
    metadata: m.metadata || {}
  }));
}

async function deleteByIds(namespace, ids) {
  const target = ns(namespace);
  // SDK v7: deleteMany({ ids: [...] }) — passing an array directly is rejected.
  await target.deleteMany({ ids: ids.map(String) });
  return { deletedCount: ids.length };
}

async function deleteByFilter(namespace, filter) {
  const target = ns(namespace);
  // Pinecone Serverless does NOT support metadata-filter deletion. Pod-based
  // indexes do — best-effort attempt.
  try {
    await target.deleteMany({ filter });
    return { deletedCount: -1 };
  } catch {
    return { deletedCount: 0, note: "filter-based delete not supported on this Pinecone tier" };
  }
}

async function deleteNamespace(namespace) {
  const target = ns(namespace);
  try {
    await target.deleteAll();
    return { deletedNamespace: namespace };
  } catch (err) {
    if (err?.name === "PineconeNotFoundError" || err?.status === 404) {
      return { deletedNamespace: namespace, note: "namespace did not exist" };
    }
    throw err;
  }
}

/**
 * Pinecone metadata accepts only string, number, boolean, or array of strings.
 * Drop nulls/undefined and coerce nested objects to JSON strings.
 */
function sanitizeMetadata(input = {}) {
  const out = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === null || value === undefined) continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      out[key] = value;
    } else if (Array.isArray(value) && value.every((v) => typeof v === "string")) {
      out[key] = value;
    } else {
      out[key] = JSON.stringify(value);
    }
  }
  return out;
}

export const pineconeDriver = {
  upsert,
  query,
  deleteByIds,
  deleteByFilter,
  deleteNamespace
};
