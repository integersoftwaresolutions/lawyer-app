/** Typed session / auth client errors */

export const SESSION_ERROR = Object.freeze({
  /** Refresh rejected — session is dead; forceLogout already ran or will run */
  SESSION_EXPIRED: "SESSION_EXPIRED",
  /** Refresh/API unreachable (5xx, network, timeout) — keep tokens */
  AUTH_UNAVAILABLE: "AUTH_UNAVAILABLE"
});

export function createSessionError(code, message, cause) {
  const err = new Error(message || code);
  err.code = code;
  err.name = "SessionError";
  if (cause) err.cause = cause;
  return err;
}

export function isSessionExpiredError(error) {
  return error?.code === SESSION_ERROR.SESSION_EXPIRED;
}

export function isAuthUnavailableError(error) {
  return error?.code === SESSION_ERROR.AUTH_UNAVAILABLE;
}
