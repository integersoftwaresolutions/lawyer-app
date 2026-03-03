import api from "./apiClient";

export const authApi = {
  register: (payload) => api.post("/auth/register", payload).then((r) => r.data),
  login: (payload) => api.post("/auth/login", payload).then((r) => r.data),
  me: () => api.get("/auth/me").then((r) => r.data),
  logout: () => api.post("/auth/logout").then((r) => r.data),
  sendOtp: (email) => api.post("/auth/send-otp", { email }).then((r) => r.data),
  verifyOtp: (email, code) => api.post("/auth/verify-otp", { email, code }).then((r) => r.data),
  resendOtp: (email) => api.post("/auth/resend-otp", { email }).then((r) => r.data)
};
