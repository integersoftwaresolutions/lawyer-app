import api from "./apiClient";
import { normalizeListResponse } from "../utils/listResponse";

export const workspaceApi = {
  list: () => api.get("/workspaces").then((r) => normalizeListResponse(r.data)),
  catalog: () => api.get("/workspaces/catalog/permissions").then((r) => r.data),
  activate: (workspaceId) => api.post(`/workspaces/${workspaceId}/activate`).then((r) => r.data),
  createFirm: (body) => api.post("/workspaces", body).then((r) => r.data),
  get: (workspaceId) => api.get(`/workspaces/${workspaceId}`).then((r) => r.data),
  update: (workspaceId, body) => api.patch(`/workspaces/${workspaceId}`, body).then((r) => r.data),
  dissolve: (workspaceId) => api.delete(`/workspaces/${workspaceId}`).then((r) => r.data),
  transfer: (workspaceId, newOwnerUserId) =>
    api.post(`/workspaces/${workspaceId}/transfer`, { newOwnerUserId }).then((r) => r.data),
  leave: (workspaceId) => api.post(`/workspaces/${workspaceId}/leave`).then((r) => r.data),

  listMembers: (workspaceId, params) =>
    api
      .get(`/workspaces/${workspaceId}/members`, { params })
      .then((r) => normalizeListResponse(r.data)),
  changeMemberRole: (workspaceId, memberUserId, roleId) =>
    api
      .patch(`/workspaces/${workspaceId}/members/${memberUserId}/role`, { roleId })
      .then((r) => r.data),
  removeMember: (workspaceId, memberUserId) =>
    api.delete(`/workspaces/${workspaceId}/members/${memberUserId}`).then((r) => r.data),

  listRoles: (workspaceId, params) =>
    api
      .get(`/workspaces/${workspaceId}/roles`, { params })
      .then((r) => normalizeListResponse(r.data)),
  createRole: (workspaceId, body) =>
    api.post(`/workspaces/${workspaceId}/roles`, body).then((r) => r.data),
  updateRole: (workspaceId, roleId, body) =>
    api.patch(`/workspaces/${workspaceId}/roles/${roleId}`, body).then((r) => r.data),
  deleteRole: (workspaceId, roleId) =>
    api.delete(`/workspaces/${workspaceId}/roles/${roleId}`).then((r) => r.data),

  listInvites: (workspaceId, params) =>
    api
      .get(`/workspaces/${workspaceId}/invites`, { params })
      .then((r) => normalizeListResponse(r.data)),
  createInvite: (workspaceId, body) =>
    api.post(`/workspaces/${workspaceId}/invites`, body).then((r) => r.data),
  revokeInvite: (workspaceId, inviteId) =>
    api.delete(`/workspaces/${workspaceId}/invites/${inviteId}`).then((r) => r.data),
  acceptInvite: (token) => api.post("/workspaces/invites/accept", { token }).then((r) => r.data),

  listAudit: (workspaceId, params) =>
    api
      .get(`/workspaces/${workspaceId}/audit`, { params })
      .then((r) => normalizeListResponse(r.data))
};

export const adminWorkspaceApi = {
  list: (params) =>
    api.get("/admin/workspaces", { params }).then((r) => normalizeListResponse(r.data))
};
