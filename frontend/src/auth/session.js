/**
 * Session lifecycle — single owner for logout / token sync / degraded mode.
 * Bind the Redux store once from store/index.js to avoid circular imports with apiClient.
 */

import { storage } from "../utils/storage";
import { SESSION_ERROR } from "./sessionErrors";

/** @type {import('@reduxjs/toolkit').EnhancedStore | null} */
let storeRef = null;

let loggingOut = false;
let refreshTimer = null;

const listeners = {
  degraded: new Set(),
  recovered: new Set(),
  logout: new Set()
};

export function bindSessionStore(store) {
  storeRef = store;
}

function getStore() {
  return storeRef;
}

function emit(type, payload) {
  listeners[type]?.forEach((fn) => {
    try {
      fn(payload);
    } catch (e) {
      console.error(`[session] ${type} listener error`, e);
    }
  });
}

export function onSessionDegraded(fn) {
  listeners.degraded.add(fn);
  return () => listeners.degraded.delete(fn);
}

export function onSessionRecovered(fn) {
  listeners.recovered.add(fn);
  return () => listeners.recovered.delete(fn);
}

export function onSessionLogout(fn) {
  listeners.logout.add(fn);
  return () => listeners.logout.delete(fn);
}

export function notifySessionDegraded(detail = {}) {
  emit("degraded", detail);
}

export function notifySessionRecovered() {
  emit("recovered", {});
}

function clearProactiveRefresh() {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

function getJwtExpiryMs(token) {
  if (!token || typeof token !== "string") return null;
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(json);
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

/**
 * Schedule a soft refresh ~60s before access token expiry.
 * @param {(signal?: { proactive: true }) => Promise<void>} refreshFn
 */
export function scheduleProactiveRefresh(refreshFn) {
  clearProactiveRefresh();
  const token = storage.getAccessToken();
  const exp = getJwtExpiryMs(token);
  if (!exp || typeof refreshFn !== "function") return;

  const leadMs = 60_000;
  const delay = Math.max(5_000, exp - Date.now() - leadMs);
  refreshTimer = setTimeout(() => {
    refreshFn({ proactive: true }).catch(() => {
      /* interceptor / forceLogout handle hard failures */
    });
  }, delay);
}

export function cancelProactiveRefresh() {
  clearProactiveRefresh();
}

/**
 * Persist new access token in storage + Redux and schedule next refresh.
 */
export function onRefreshSuccess(accessToken, { scheduleRefresh } = {}) {
  if (!accessToken) return;
  storage.setAccessToken(accessToken);
  const store = getStore();
  if (store) {
    // Keep Redux accessToken in sync with storage (same as setAccessToken reducer)
    store.dispatch({ type: "auth/setAccessToken", payload: accessToken });
  }
  notifySessionRecovered();
  if (typeof scheduleRefresh === "function") {
    scheduleProactiveRefresh(scheduleRefresh);
  }
}

/**
 * Full session teardown. Safe to call multiple times.
 *
 * @param {object} [opts]
 * @param {'session_expired'|'user'|'unauthenticated'} [opts.reason]
 * @param {boolean} [opts.redirect=true]
 * @param {boolean} [opts.clearServerSession=true] best-effort /auth/logout
 */
export async function forceLogout({
  reason = "session_expired",
  redirect = true,
  clearServerSession = true
} = {}) {
  if (loggingOut) return;
  loggingOut = true;
  clearProactiveRefresh();

  const token = storage.getAccessToken();

  try {
    const store = getStore();
    if (store) {
      const { clearAuth } = await import("../store/slices/authSlice");
      const { clearWorkspaces } = await import("../store/slices/workspaceSlice");
      store.dispatch(clearAuth());
      store.dispatch(clearWorkspaces());
    } else {
      storage.clear();
    }

    try {
      localStorage.removeItem("activeWorkspaceId");
    } catch {
      /* ignore */
    }

    if (clearServerSession) {
      const base = import.meta.env.VITE_API_BASE || "";
      try {
        await fetch(`${base}/api/auth/logout`, {
          method: "POST",
          credentials: "include",
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
      } catch {
        /* ignore — cookie may already be gone */
      }
    }

    emit("logout", { reason });
  } finally {
    if (redirect && typeof window !== "undefined") {
      const path = window.location.pathname || "";
      if (!path.startsWith("/login")) {
        const q =
          reason === "session_expired"
            ? "?reason=session_expired"
            : reason === "unauthenticated"
              ? "?reason=unauthenticated"
              : "";
        window.location.assign(`/login${q}`);
        return;
      }
    }
    // Allow future logout attempts after staying on login
    loggingOut = false;
  }
}

export function isLoggingOut() {
  return loggingOut;
}

export { SESSION_ERROR };
