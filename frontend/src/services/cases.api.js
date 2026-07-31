import api from "./apiClient";
import { normalizeListResponse } from "../utils/listResponse";

const asList = (promise) => promise.then((r) => normalizeListResponse(r.data));
const asData = (promise) => promise.then((r) => r.data);

export const casesApi = {
  getMeta: () => asData(api.get("/cases/meta")),
  list: (params) => asList(api.get("/cases", { params })),
  get: (caseId) => asData(api.get(`/cases/${caseId}`)),
  create: (body) => asData(api.post("/cases", body)),
  update: (caseId, body) => asData(api.patch(`/cases/${caseId}`, body)),
  assign: (caseId, body) => asData(api.post(`/cases/${caseId}/assign`, body)),
  setStatus: (caseId, status) => asData(api.post(`/cases/${caseId}/status`, { status })),
  archive: (caseId) => asData(api.post(`/cases/${caseId}/archive`)),
  restore: (caseId) => asData(api.post(`/cases/${caseId}/restore`)),
  remove: (caseId) => asData(api.delete(`/cases/${caseId}`)),
  addNote: (caseId, body) => asData(api.post(`/cases/${caseId}/notes`, { body })),
  updateNote: (caseId, noteId, body) =>
    asData(api.patch(`/cases/${caseId}/notes/${noteId}`, { body })),
  deleteNote: (caseId, noteId) => asData(api.delete(`/cases/${caseId}/notes/${noteId}`)),
  listDocuments: (caseId, params) => asList(api.get(`/cases/${caseId}/documents`, { params })),
  attachDocument: (caseId, documentId) =>
    asData(api.post(`/cases/${caseId}/documents`, { documentId })),
  detachDocument: (caseId, documentId) =>
    asData(api.delete(`/cases/${caseId}/documents/${documentId}`)),
  linkBooking: (caseId, bookingId) =>
    asData(api.post(`/cases/${caseId}/booking`, { bookingId }))
};
