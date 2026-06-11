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
  return {
    page,
    limit: safeLimit,
    total,
    pages: Math.max(1, Math.ceil(total / safeLimit))
  };
}

export function paginatedResponse(items, total, pagination) {
  return {
    items,
    meta: buildPaginationMeta(total, pagination)
  };
}
