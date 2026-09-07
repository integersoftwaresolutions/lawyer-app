import { ApiError } from "../helpers/apiError.js";
import { sendError } from "../helpers/response.helper.js";

export function errorMiddleware(err, req, res, next) {
  const isApi = err instanceof ApiError;
  const statusCode = isApi ? err.statusCode : 500;

  const payload = {
    statusCode,
    message: err.message || "Server Error",
    code: isApi ? err.code : undefined,
    errors: isApi ? err.errors : undefined
  };

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  return sendError(res, payload);
}
