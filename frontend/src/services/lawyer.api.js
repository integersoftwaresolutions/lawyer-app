import api from "./apiClient";
import { normalizeListResponse } from "../utils/listResponse";

const asList = (promise) => promise.then((r) => normalizeListResponse(r.data));

export const lawyerApi = {
  search: (params) => asList(api.get("/lawyers", { params })),

  profile: (lawyerUserId) => api.get(`/lawyers/${lawyerUserId}`).then((r) => r.data),

  getAvailableSlots: (lawyerUserId, date) =>
    asList(api.get(`/lawyers/${lawyerUserId}/slots`, { params: { date } })),

  getLawyerReviews: (lawyerUserId, params) =>
    asList(api.get(`/lawyers/${lawyerUserId}/reviews`, { params })),

  getContactDetails: (lawyerUserId) =>
    api.get(`/lawyers/${lawyerUserId}/contact`).then((r) => r.data),

  getMyProfile: () => api.get("/lawyers/me/profile").then((r) => r.data),

  getMyProfileBoostInfo: () => api.get("/lawyers/me/profile-boost").then((r) => r.data),

  purchaseProfileBoost: (durationDays) =>
    api.post("/lawyers/me/profile-boost", { durationDays }).then((r) => r.data),

  updateMyProfile: (payload) => api.put("/lawyers/me/profile", payload).then((r) => r.data),

  getMyBookings: (params) => asList(api.get("/lawyers/me/bookings", { params })),

  rescheduleMyBooking: (bookingId, payload) =>
    api.patch(`/lawyers/me/bookings/${bookingId}`, payload).then((r) => r.data),

  deleteMyBooking: (bookingId) =>
    api.delete(`/lawyers/me/bookings/${bookingId}`).then((r) => r.data),

  getMyStats: () => api.get("/lawyers/me/stats").then((r) => r.data),

  getMyEarnings: (params) => asList(api.get("/lawyers/me/earnings", { params })),

  hideEarningHistory: (entryId) => api.delete(`/wallet/ledger/${entryId}`).then((r) => r.data),

  raiseDispute: (bookingId, payload) =>
    api.post(`/lawyers/me/bookings/${bookingId}/dispute`, payload).then((r) => r.data),
  getMyDisputes: (params) => asList(api.get("/lawyers/me/disputes", { params })),

  getMyAvailability: () => api.get("/lawyers/me/availability").then((r) => r.data),

  updateMyAvailability: (payload) =>
    api.put("/lawyers/me/availability", payload).then((r) => r.data),

  getMyReviews: (params) => asList(api.get("/lawyers/me/reviews", { params })),

  getVerificationStatus: () => api.get("/lawyers/me/verification/status").then((r) => r.data),

  uploadVerificationDocument: (documentType, file) => {
    const form = new FormData();
    form.append("documentType", documentType);
    form.append("file", file);
    return api
      .post("/lawyers/me/verification/documents", form, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      .then((r) => r.data);
  }
};
