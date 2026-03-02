import api from "./apiClient";

export const lawyerApi = {
  search: (params) => api.get("/lawyers", { params }).then((r) => r.data),
  
  profile: (lawyerUserId) => api.get(`/lawyers/${lawyerUserId}`).then((r) => r.data),
  
  getAvailableSlots: (lawyerUserId, date) => 
    api.get(`/lawyers/${lawyerUserId}/slots`, { params: { date } }).then((r) => r.data),
  
  getLawyerReviews: (lawyerUserId, params) => 
    api.get(`/lawyers/${lawyerUserId}/reviews`, { params }).then((r) => r.data),
  
  getMyProfile: () => api.get("/lawyers/me/profile").then((r) => r.data),
  
  updateMyProfile: (payload) => api.put("/lawyers/me/profile", payload).then((r) => r.data),
  
  getMyBookings: (params) => api.get("/lawyers/me/bookings", { params }).then((r) => r.data),

  rescheduleMyBooking: (bookingId, payload) => api.patch(`/lawyers/me/bookings/${bookingId}`, payload).then((r) => r.data),

  deleteMyBooking: (bookingId) => api.delete(`/lawyers/me/bookings/${bookingId}`).then((r) => r.data),
  
  getMyStats: () => api.get("/lawyers/me/stats").then((r) => r.data),
  
  getMyEarnings: (params) => api.get("/lawyers/me/earnings", { params }).then((r) => r.data),

  hideEarningHistory: (entryId) => api.delete(`/wallet/ledger/${entryId}`).then((r) => r.data),
  
  getMyAvailability: () => api.get("/lawyers/me/availability").then((r) => r.data),
  
  updateMyAvailability: (payload) => api.put("/lawyers/me/availability", payload).then((r) => r.data),
  
  getMyReviews: (params) => api.get("/lawyers/me/reviews", { params }).then((r) => r.data),

  uploadVerificationDocument: (documentType, file) => {
    const form = new FormData();
    form.append("documentType", documentType);
    form.append("file", file);
    return api
      .post("/lawyers/me/verification/documents", form, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      .then((r) => r.data);
  },
};
