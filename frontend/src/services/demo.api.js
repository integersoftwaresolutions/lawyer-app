import api from "./apiClient.js";

/**
 * Public lead form — no auth required.
 * @param {object} payload
 */
export async function submitDemoRequest(payload) {
  const { data } = await api.post("/demo-requests", payload);
  return data;
}
