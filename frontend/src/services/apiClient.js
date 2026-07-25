import axios from "axios";
import { storage } from "../utils/storage.js";
import {
  forceLogout,
  isLoggingOut,
  notifySessionDegraded,
  onRefreshSuccess,
  scheduleProactiveRefresh
} from "../auth/session.js";
import {
  SESSION_ERROR,
  createSessionError,
  isSessionExpiredError
} from "../auth/sessionErrors.js";

const REQUEST_TIMEOUT_MS = 20_000;

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE}/api`,
  withCredentials: true,
  timeout: REQUEST_TIMEOUT_MS
});

api.interceptors.request.use((config) => {
  const token = storage.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const url = config.url || "";
  if (url.startsWith("/ai")) {
    try {
      const workspaceId = localStorage.getItem("activeWorkspaceId");
      if (workspaceId) config.headers["X-Workspace-Id"] = workspaceId;
    } catch {
      /* ignore */
    }
  }

  return config;
});

let refreshing = false;
let queue = [];

function resolveQueue(err, token = null) {
  queue.forEach((p) => (err ? p.reject(err) : p.resolve(token)));
  queue = [];
}

function isAuthEndpoint(url = "") {
  return (
    url.includes("/auth/login") ||
    url.includes("/auth/register") ||
    url.includes("/auth/refresh") ||
    url.includes("/auth/logout")
  );
}

function isTransientRefreshFailure(error) {
  if (!error.response) return true; // network / timeout
  const status = error.response.status;
  return status >= 500 || status === 408 || status === 429;
}

/**
 * Single-flight refresh. Used by interceptor and proactive scheduler.
 */
export async function refreshAccessToken({ proactive = false } = {}) {
  if (isLoggingOut()) {
    throw createSessionError(SESSION_ERROR.SESSION_EXPIRED, "Session ended");
  }

  if (refreshing) {
    return new Promise((resolve, reject) => {
      queue.push({ resolve, reject });
    });
  }

  refreshing = true;
  try {
    const res = await api.post(
      "/auth/refresh",
      {},
      { _skipAuthRefresh: true, timeout: REQUEST_TIMEOUT_MS }
    );
    const newToken = res.data?.data?.accessToken;
    if (!newToken) {
      throw createSessionError(
        SESSION_ERROR.SESSION_EXPIRED,
        "Refresh did not return accessToken"
      );
    }
    onRefreshSuccess(newToken, { scheduleRefresh: () => refreshAccessToken({ proactive: true }) });
    resolveQueue(null, newToken);
    return newToken;
  } catch (e) {
    if (isSessionExpiredError(e)) {
      resolveQueue(e, null);
      await forceLogout({ reason: "session_expired" });
      throw e;
    }

    const status = e.response?.status;
    if (status === 401 || status === 403) {
      const err = createSessionError(
        SESSION_ERROR.SESSION_EXPIRED,
        e.response?.data?.message || "Session expired",
        e
      );
      resolveQueue(err, null);
      await forceLogout({ reason: "session_expired" });
      throw err;
    }

    if (isTransientRefreshFailure(e) || !e.response) {
      const err = createSessionError(
        SESSION_ERROR.AUTH_UNAVAILABLE,
        "Can't reach the server. Check your connection and try again.",
        e
      );
      resolveQueue(err, null);
      if (!proactive) {
        notifySessionDegraded({ message: err.message });
      }
      throw err;
    }

    resolveQueue(e, null);
    throw e;
  } finally {
    refreshing = false;
  }
}

// Kick proactive refresh if a token already exists (e.g. after reload)
if (typeof window !== "undefined" && storage.getAccessToken()) {
  scheduleProactiveRefresh(() => refreshAccessToken({ proactive: true }));
}

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err.config;
    if (!original) throw err;

    const status = err.response?.status;
    const url = original.url || "";

    if (original._skipAuthRefresh || isAuthEndpoint(url)) {
      throw err;
    }

    if (status === 401 && !original._retry) {
      if (isLoggingOut()) {
        throw createSessionError(SESSION_ERROR.SESSION_EXPIRED, "Session ended");
      }

      const existingToken = storage.getAccessToken();
      if (!existingToken) {
        await forceLogout({ reason: "unauthenticated", clearServerSession: false });
        throw createSessionError(SESSION_ERROR.SESSION_EXPIRED, "Not authenticated");
      }

      original._retry = true;

      try {
        const newToken = await refreshAccessToken();
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshErr) {
        throw refreshErr;
      }
    }

    throw err;
  }
);

export default api;
