import api from "./apiClient";

export const bookingApi = {
  create: (payload) => api.post("/bookings", payload).then((r) => r.data),
  get: (bookingId) => api.get(`/bookings/${bookingId}`).then((r) => r.data),
  activate: (bookingId) => api.post(`/bookings/${bookingId}/activate`).then((r) => r.data),
  complete: (bookingId) => api.post(`/bookings/${bookingId}/complete`).then((r) => r.data),
  session: (bookingId) => api.get(`/bookings/${bookingId}/session`).then((r) => r.data)
};
