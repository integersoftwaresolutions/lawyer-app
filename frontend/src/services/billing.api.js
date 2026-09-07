import api from "./apiClient";
import { normalizeListResponse } from "../utils/listResponse";

export const billingApi = {
  /** Public — no auth required */
  publicPlans: () => api.get("/billing/plans").then((r) => r.data),
  catalog: () => api.get("/billing/catalog").then((r) => r.data),
  entitlements: (workspaceId) =>
    api.get(`/billing/workspaces/${workspaceId}/entitlements`).then((r) => r.data),
  subscription: (workspaceId) =>
    api.get(`/billing/workspaces/${workspaceId}/subscription`).then((r) => r.data),
  checkout: (workspaceId, body) =>
    api.post(`/billing/workspaces/${workspaceId}/checkout`, body).then((r) => r.data),
  portal: (workspaceId, body = {}) =>
    api.post(`/billing/workspaces/${workspaceId}/portal`, body).then((r) => r.data)
};

export const adminBillingApi = {
  catalog: () => api.get("/admin/billing/catalog").then((r) => r.data),
  listSubscriptions: (params) =>
    api.get("/admin/billing/subscriptions", { params }).then((r) => normalizeListResponse(r.data)),
  getSubscription: (workspaceId) =>
    api.get(`/admin/billing/subscriptions/${workspaceId}`).then((r) => r.data),
  grant: (workspaceId, body) =>
    api.post(`/admin/billing/subscriptions/${workspaceId}/grant`, body).then((r) => r.data),
  forceFree: (workspaceId, body = {}) =>
    api.post(`/admin/billing/subscriptions/${workspaceId}/force-free`, body).then((r) => r.data),
  reconcile: (workspaceId) =>
    api.post(`/admin/billing/subscriptions/${workspaceId}/reconcile`).then((r) => r.data)
};
