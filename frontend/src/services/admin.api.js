import api from "./apiClient";

export const adminApi = {
  getAnalytics: () => api.get("/admin/analytics").then((r) => r.data),
  
  getUsers: (params) => api.get("/admin/users", { params }).then((r) => r.data),
  
  getBookings: (params) => api.get("/admin/bookings", { params }).then((r) => r.data),
  
  getLawyers: (params) => api.get("/admin/lawyers", { params }).then((r) => r.data),
  
  getPendingLawyers: () => api.get("/admin/lawyers/pending").then((r) => r.data),
  
  verifyLawyer: (lawyerUserId, payload) => 
    api.post(`/admin/lawyers/${lawyerUserId}/verify`, payload).then((r) => r.data),
  
  getVerificationDocs: (lawyerUserId) => 
    api.get(`/admin/lawyers/${lawyerUserId}/documents`).then((r) => r.data),
  
  reviewDocument: (documentId, payload) => 
    api.post(`/admin/documents/${documentId}/review`, payload).then((r) => r.data),
  
  getSettings: () => api.get("/admin/settings").then((r) => r.data),
  
  updateSettings: (payload) => api.put("/admin/settings", payload).then((r) => r.data),
};
