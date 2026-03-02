import api from "./apiClient";

export const constantsApi = {
  getConstants: () => api.get("/constants").then((r) => r.data),
};
