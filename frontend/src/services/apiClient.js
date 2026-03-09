import axios from "axios";
import { storage } from "../utils/storage.js";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE}/api`,
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = storage.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing = false;
let queue = [];

function resolveQueue(err, token = null) {
  queue.forEach((p) => (err ? p.reject(err) : p.resolve(token)));
  queue = [];
}

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err.config;
    const status = err.response?.status;

    const url = original?.url || "";
    const isAuthEndpoint =
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/logout");

    if (status === 401 && !original._retry && !isAuthEndpoint) {
      const existingToken = storage.getAccessToken();
      if (!existingToken) throw err;

      original._retry = true;

      if (refreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      refreshing = true;
      try {
        const res = await api.post("/auth/refresh", {});
        const newToken = res.data?.data?.accessToken;
        if (!newToken) throw new Error("Refresh did not return accessToken");
        storage.setAccessToken(newToken);
        resolveQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (e) {
        resolveQueue(e, null);
        const refreshStatus = e.response?.status;
        if (refreshStatus === 401) storage.clear();
        throw e;
      } finally {
        refreshing = false;
      }
    }

    throw err;
  }
);

export default api;
