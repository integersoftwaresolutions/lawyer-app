import api from "./apiClient";
import { normalizeListResponse } from "../utils/listResponse";

const asList = (promise) => promise.then((r) => normalizeListResponse(r.data));

export const clientApi = {
  getMyProfile: () => api.get("/clients/me/profile").then((r) => r.data),
  updateMyProfile: (payload) => api.put("/clients/me/profile", payload).then((r) => r.data),
  getMyBookings: (params) => asList(api.get("/clients/me/bookings", { params })),
  rescheduleMyBooking: (bookingId, payload) =>
    api.patch(`/clients/me/bookings/${bookingId}`, payload).then((r) => r.data),
  deleteMyBooking: (bookingId) =>
    api.delete(`/clients/me/bookings/${bookingId}`).then((r) => r.data),
  getMyStats: () => api.get("/clients/me/stats").then((r) => r.data),
  createReview: (payload) => api.post("/clients/me/reviews", payload).then((r) => r.data),
  getMyReviews: (params) => asList(api.get("/clients/me/reviews", { params })),
  raiseDispute: (bookingId, payload) =>
    api.post(`/clients/me/bookings/${bookingId}/dispute`, payload).then((r) => r.data),
  getMyDisputes: (params) => asList(api.get("/clients/me/disputes", { params }))
};
