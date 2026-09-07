export function sendSuccess(res, { statusCode = 200, message = "OK", data = null, meta = undefined, summary = undefined }) {
  return res.status(statusCode).json({
    success: true,
    statusCode,
    message,
    data,
    ...(meta ? { meta } : {}),
    ...(summary !== undefined ? { summary } : {})
  });
}

/**
 * Canonical list success response:
 * { data: { items, ...extras }, meta: { page, limit, total, pages } }
 *
 * Accepts listResult() ({ items, meta, extras }) or legacy ({ items, meta, unreadCount, summary, ... }).
 */
export function sendListSuccess(res, opts = {}) {
  const {
    statusCode = 200,
    message = "OK",
    items,
    meta,
    extras = {},
    data,
    summary,
    ...rest
  } = opts;

  const listItems = items ?? data?.items ?? [];
  const listMeta = meta ?? data?.meta;

  const fromData =
    data && typeof data === "object"
      ? Object.fromEntries(Object.entries(data).filter(([k]) => k !== "items" && k !== "meta"))
      : {};

  // Fold legacy top-level extras (unreadCount, summary, hasConflict, etc.) into data
  const listExtras = {
    ...fromData,
    ...(extras || {}),
    ...rest,
    ...(summary !== undefined ? { summary } : {})
  };

  const payload = {
    items: Array.isArray(listItems) ? listItems : [],
    ...listExtras
  };

  return res.status(statusCode).json({
    success: true,
    statusCode,
    message,
    data: payload,
    ...(listMeta ? { meta: listMeta } : {})
  });
}

export function sendError(res, { statusCode = 500, message = "Server Error", errors = undefined, code = undefined }) {
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    ...(code ? { code } : {}),
    ...(errors ? { errors } : {})
  });
}
