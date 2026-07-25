import api from "./apiClient";
import { normalizeListResponse } from "../utils/listResponse";

const asList = (promise) => promise.then((r) => normalizeListResponse(r.data));

export const adminApi = {
  getAnalytics: () => api.get("/admin/analytics").then((r) => r.data),
  getUsers: (params) => asList(api.get("/admin/users", { params })),
  getBookings: (params) => asList(api.get("/admin/bookings", { params })),
  getLawyers: (params) => asList(api.get("/admin/lawyers", { params })),
  getPendingLawyers: (params) => asList(api.get("/admin/lawyers/pending", { params })),
  verifyLawyer: (lawyerUserId, payload) =>
    api.post(`/admin/lawyers/${lawyerUserId}/verify`, payload).then((r) => r.data),
  getLawyerVerification: (lawyerUserId) =>
    api.get(`/admin/lawyers/${lawyerUserId}/verification`).then((r) => r.data),
  getLawyerDocuments: (lawyerUserId) =>
    api.get(`/admin/lawyers/${lawyerUserId}/documents`).then((r) => r.data),
  reviewDocument: (documentId, payload) =>
    api.post(`/admin/documents/${documentId}/review`, payload).then((r) => r.data),
  getSettings: () => api.get("/admin/settings").then((r) => r.data),
  updateSettings: (payload) => api.put("/admin/settings", payload).then((r) => r.data),
  getDisputes: (params) => asList(api.get("/admin/disputes", { params })),
  getDispute: (disputeId) => api.get(`/admin/disputes/${disputeId}`).then((r) => r.data),
  updateDisputeStatus: (disputeId, payload) =>
    api.patch(`/admin/disputes/${disputeId}/status`, payload).then((r) => r.data),
  resolveDispute: (disputeId, payload) =>
    api.post(`/admin/disputes/${disputeId}/resolve`, payload).then((r) => r.data)
};
