import api from "./apiClient.js";

/**
 * Public lead form — no auth required.
 * @param {object} payload
 */
export async function submitFeatureRequest(payload) {
  const { data } = await api.post("/feature-requests", payload);
  return data;
}
