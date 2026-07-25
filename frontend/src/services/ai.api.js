import api from "./apiClient";
import { normalizeListResponse } from "../utils/listResponse";

const asList = (promise) => promise.then((r) => normalizeListResponse(r.data));

export const aiApi = {
  getConfig: () => api.get("/ai/config").then((r) => r.data),

  listSessions: (params) => asList(api.get("/ai/sessions", { params })),
  createSession: (body) => api.post("/ai/sessions", body).then((r) => r.data),
  getSession: (sessionId) => api.get(`/ai/sessions/${sessionId}`).then((r) => r.data),
  sendMessage: (sessionId, body) =>
    api.post(`/ai/sessions/${sessionId}/messages`, body).then((r) => r.data),
  updateSession: (sessionId, body) =>
    api.patch(`/ai/sessions/${sessionId}`, body).then((r) => r.data),
  deleteSession: (sessionId) => api.delete(`/ai/sessions/${sessionId}`).then((r) => r.data),

  generatePrepReport: (sessionId) =>
    api.get(`/ai/sessions/${sessionId}/report`).then((r) => r.data),
  getPrepReportPdfUrl: (sessionId) =>
    `${api.defaults.baseURL || ""}/ai/sessions/${sessionId}/report.pdf`,
  downloadPrepReportPdf: (sessionId) =>
    api
      .get(`/ai/sessions/${sessionId}/report.pdf`, { responseType: "blob" })
      .then((r) => r.data),

  getUsageSummary: (period = "month") =>
    api.get("/ai/usage/summary", { params: { period } }).then((r) => r.data),

  listDocuments: (params) => asList(api.get("/ai/documents", { params })),
  getDocument: (documentId) => api.get(`/ai/documents/${documentId}`).then((r) => r.data),
  ingestDocumentJson: (body) => api.post("/ai/documents", body).then((r) => r.data),
  ingestDocumentForm: (formData) =>
    api
      .post("/ai/documents", formData, { headers: { "Content-Type": "multipart/form-data" } })
      .then((r) => r.data),
  deleteDocument: (documentId) => api.delete(`/ai/documents/${documentId}`).then((r) => r.data),
  updateDocumentVisibility: (documentId, visibility) =>
    api.patch(`/ai/documents/${documentId}/visibility`, { visibility }).then((r) => r.data)
};

export const adminRagApi = {
  listCaseLaw: (params) => asList(api.get("/admin/rag/case-law", { params })),
  getCaseLaw: (caseLawId) => api.get(`/admin/rag/case-law/${caseLawId}`).then((r) => r.data),
  ingestCaseLawJson: (body) => api.post("/admin/rag/case-law", body).then((r) => r.data),
  ingestCaseLawForm: (formData) =>
    api
      .post("/admin/rag/case-law", formData, { headers: { "Content-Type": "multipart/form-data" } })
      .then((r) => r.data),
  deleteCaseLaw: (caseLawId) => api.delete(`/admin/rag/case-law/${caseLawId}`).then((r) => r.data)
};
