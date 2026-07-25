/**
 * Normalize list API envelopes to a stable client shape:
 * { items, meta, ...extras }
 *
 * Accepts full axios/body envelope `{ success, data, meta }` or already-normalized objects.
 */
export function normalizeListResponse(res) {
  if (!res || typeof res !== "object") {
    return { items: [], meta: emptyMeta() };
  }

  // Already normalized
  if (Array.isArray(res.items) && res.meta) {
    const { items, meta, ...extras } = res;
    return { items, meta: normalizeMeta(meta), ...extras };
  }

  const envelope = res.data !== undefined && (res.success !== undefined || res.meta !== undefined || res.statusCode !== undefined)
    ? res
    : null;

  if (envelope) {
    const payload = envelope.data;
    const meta = normalizeMeta(envelope.meta);

    if (Array.isArray(payload)) {
      // Legacy: data was a bare array
      return { items: payload, meta: meta.total ? meta : { ...meta, total: payload.length } };
    }

    if (payload && typeof payload === "object") {
      const { items = [], meta: nestedMeta, ...extras } = payload;
      return {
        items: Array.isArray(items) ? items : [],
        meta: normalizeMeta(envelope.meta || nestedMeta),
        ...extras
      };
    }

    return { items: [], meta };
  }

  // Service layer passed through `{ data: { items }, meta }` after .then(r => r.data)
  if (res.data && typeof res.data === "object" && !Array.isArray(res.data)) {
    const { items = [], ...extras } = res.data;
    return {
      items: Array.isArray(items) ? items : [],
      meta: normalizeMeta(res.meta),
      ...extras
    };
  }

  if (Array.isArray(res.data)) {
    return {
      items: res.data,
      meta: normalizeMeta(res.meta) || { ...emptyMeta(), total: res.data.length }
    };
  }

  return { items: [], meta: emptyMeta() };
}

function emptyMeta(limit = 10) {
  return { page: 1, limit, total: 0, pages: 1 };
}

function normalizeMeta(meta) {
  if (!meta || typeof meta !== "object") return emptyMeta();
  return {
    page: Number(meta.page) || 1,
    limit: Number(meta.limit) || 10,
    total: Number(meta.total) || 0,
    pages: Math.max(1, Number(meta.pages) || 1)
  };
}
