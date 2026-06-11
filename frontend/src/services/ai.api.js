import api from "./apiClient";

export const aiApi = {
  listSessions: (params) => api.get("/ai/sessions", { params }).then((r) => r.data),
  createSession: (body) => api.post("/ai/sessions", body).then((r) => r.data),
  getSession: (sessionId) => api.get(`/ai/sessions/${sessionId}`).then((r) => r.data),
  sendMessage: (sessionId, body) =>
    api.post(`/ai/sessions/${sessionId}/messages`, body).then((r) => r.data),
  deleteSession: (sessionId) => api.delete(`/ai/sessions/${sessionId}`).then((r) => r.data),
  getUsageSummary: (period = "month") =>
    api.get("/ai/usage/summary", { params: { period } }).then((r) => r.data)
};
