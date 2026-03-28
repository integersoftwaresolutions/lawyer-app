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

export function sendError(res, { statusCode = 500, message = "Server Error", errors = undefined }) {
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    ...(errors ? { errors } : {})
  });
}
