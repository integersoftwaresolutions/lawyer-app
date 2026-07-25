import api from "./apiClient";
import { normalizeListResponse } from "../utils/listResponse";

export const notificationsApi = {
  list: ({ page = 1, limit = 20, unreadOnly = false } = {}) =>
    api
      .get("/notifications", {
        params: { page, limit, unreadOnly: unreadOnly ? "true" : "false" }
      })
      .then((r) => normalizeListResponse(r.data)),

  unreadCount: () => api.get("/notifications/unread-count").then((r) => r.data),

  markAsRead: (id) => api.patch(`/notifications/${id}/read`).then((r) => r.data),

  markAllAsRead: () => api.post("/notifications/read-all").then((r) => r.data),

  getPreferences: () => api.get("/notifications/preferences").then((r) => r.data),

  updatePreference: ({ type, channel, enabled }) =>
    api.patch("/notifications/preferences", { type, channel, enabled }).then((r) => r.data),

  bulkPreferences: (action) =>
    api.post("/notifications/preferences/bulk", { action }).then((r) => r.data)
};
