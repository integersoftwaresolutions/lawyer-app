import api from "./apiClient";

export const clientApi = {
  getMyProfile: () => api.get("/clients/me/profile").then((r) => r.data),
  
  updateMyProfile: (payload) => api.put("/clients/me/profile", payload).then((r) => r.data),
  
  getMyBookings: (params) => api.get("/clients/me/bookings", { params }).then((r) => r.data),

  rescheduleMyBooking: (bookingId, payload) => api.patch(`/clients/me/bookings/${bookingId}`, payload).then((r) => r.data),

  deleteMyBooking: (bookingId) => api.delete(`/clients/me/bookings/${bookingId}`).then((r) => r.data),
  
  getMyStats: () => api.get("/clients/me/stats").then((r) => r.data),
  
  createReview: (payload) => api.post("/clients/me/reviews", payload).then((r) => r.data),
  
  getMyReviews: (params) => api.get("/clients/me/reviews", { params }).then((r) => r.data),
};
