/**
 * Offset pagination helpers + canonical list result shape.
 */

export function getPagination(query = {}, defaults = {}) {
  const page = Math.max(1, Number(query.page ?? defaults.page ?? 1));
  const maxLimit = defaults.maxLimit ?? 50;
  const defaultLimit = defaults.limit ?? 10;
  const limit = Math.min(maxLimit, Math.max(1, Number(query.limit ?? defaultLimit)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function buildPaginationMeta(total, { page, limit }) {
  const safeLimit = Math.max(1, limit);
  const safeTotal = Math.max(0, Number(total) || 0);
  return {
    page,
    limit: safeLimit,
    total: safeTotal,
    pages: Math.max(1, Math.ceil(safeTotal / safeLimit) || 1)
  };
}

/**
 * Canonical service return for list endpoints.
 * Controllers should pass this to sendListSuccess.
 *
 * @param {{ items: any[], total: number, pagination: { page: number, limit: number }, extras?: Record<string, any> }} args
 */
export function listResult({ items = [], total = 0, pagination, extras = {} } = {}) {
  const page = pagination?.page ?? 1;
  const limit = pagination?.limit ?? (Array.isArray(items) ? items.length || 10 : 10);
  return {
    items,
    meta: buildPaginationMeta(total, { page, limit }),
    extras: extras && typeof extras === "object" ? extras : {}
  };
}

/** @deprecated Prefer listResult — kept for compatibility during migration */
export function paginatedResponse(items, total, pagination) {
  return listResult({ items, total, pagination });
}

/**
 * Unpaginated / date-bounded collections still use the list contract.
 */
export function listResultFromArray(items = [], extras = {}) {
  const arr = Array.isArray(items) ? items : [];
  return listResult({
    items: arr,
    total: arr.length,
    pagination: { page: 1, limit: Math.max(arr.length, 1) },
    extras
  });
}
