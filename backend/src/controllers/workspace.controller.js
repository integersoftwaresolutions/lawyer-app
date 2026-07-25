import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess, sendListSuccess } from "../helpers/response.helper.js";
import * as workspaceService from "../services/workspace.service.js";
import { notifyWorkspaceInvite } from "../notifications/triggers/workspace.notifications.js";
import { listResultFromArray } from "../utils/pagination.js";

export const listMine = asyncHandler(async (req, res) => {
  const items = await workspaceService.listMyWorkspaces(req.user.id);
  return sendListSuccess(res, { message: "Workspaces", ...listResultFromArray(items) });
});

export const getCatalog = asyncHandler(async (req, res) => {
  const data = await workspaceService.getPermissionCatalog();
  return sendSuccess(res, { message: "Permission catalog", data });
});

export const activate = asyncHandler(async (req, res) => {
  const data = await workspaceService.activateWorkspace(req.user.id, req.params.workspaceId);
  return sendSuccess(res, { message: "Workspace activated", data });
});

export const createFirm = asyncHandler(async (req, res) => {
  const data = await workspaceService.createFirm(req.user.id, req.body);
  return sendSuccess(res, { statusCode: 201, message: "Firm created", data });
});

export const getOne = asyncHandler(async (req, res) => {
  const data = await workspaceService.getWorkspaceDetail(req.user.id, req.params.workspaceId);
  return sendSuccess(res, { message: "Workspace", data });
});

export const updateFirm = asyncHandler(async (req, res) => {
  const data = await workspaceService.updateFirm(req.user.id, req.params.workspaceId, req.body);
  return sendSuccess(res, { message: "Workspace updated", data });
});

export const dissolve = asyncHandler(async (req, res) => {
  const data = await workspaceService.dissolveFirm(req.user.id, req.params.workspaceId);
  return sendSuccess(res, { message: "Firm dissolved", data });
});

export const transfer = asyncHandler(async (req, res) => {
  const data = await workspaceService.transferOwnership(
    req.user.id,
    req.params.workspaceId,
    req.body.newOwnerUserId
  );
  return sendSuccess(res, { message: "Ownership transferred", data });
});

export const listMembers = asyncHandler(async (req, res) => {
  const out = await workspaceService.listMembers(req.user.id, req.params.workspaceId, req.query);
  return sendListSuccess(res, { message: "Members", ...out });
});

export const changeMemberRole = asyncHandler(async (req, res) => {
  const data = await workspaceService.changeMemberRole(
    req.user.id,
    req.params.workspaceId,
    req.params.memberUserId,
    req.body.roleId
  );
  return sendSuccess(res, { message: "Member role updated", data });
});

export const removeMember = asyncHandler(async (req, res) => {
  const data = await workspaceService.removeMember(
    req.user.id,
    req.params.workspaceId,
    req.params.memberUserId
  );
  return sendSuccess(res, { message: "Member removed", data });
});

export const leave = asyncHandler(async (req, res) => {
  const data = await workspaceService.leaveWorkspace(req.user.id, req.params.workspaceId);
  return sendSuccess(res, { message: "Left workspace", data });
});

export const listRoles = asyncHandler(async (req, res) => {
  const out = await workspaceService.listRoles(req.user.id, req.params.workspaceId, req.query);
  return sendListSuccess(res, { message: "Roles", ...out });
});

export const createRole = asyncHandler(async (req, res) => {
  const data = await workspaceService.createCustomRole(req.user.id, req.params.workspaceId, req.body);
  return sendSuccess(res, { statusCode: 201, message: "Role created", data });
});

export const updateRole = asyncHandler(async (req, res) => {
  const data = await workspaceService.updateCustomRole(
    req.user.id,
    req.params.workspaceId,
    req.params.roleId,
    req.body
  );
  return sendSuccess(res, { message: "Role updated", data });
});

export const deleteRole = asyncHandler(async (req, res) => {
  const data = await workspaceService.deleteCustomRole(
    req.user.id,
    req.params.workspaceId,
    req.params.roleId
  );
  return sendSuccess(res, { message: "Role deleted", data });
});

export const listInvites = asyncHandler(async (req, res) => {
  const out = await workspaceService.listInvites(req.user.id, req.params.workspaceId, req.query);
  return sendListSuccess(res, { message: "Invites", ...out });
});

export const createInvite = asyncHandler(async (req, res) => {
  const data = await workspaceService.createInvite(req.user.id, req.params.workspaceId, req.body);
  try {
    await notifyWorkspaceInvite({
      invite: data,
      workspaceId: req.params.workspaceId,
      invitedByUserId: req.user.id
    });
  } catch (err) {
    console.warn("Workspace invite notification failed:", err.message);
  }
  return sendSuccess(res, { statusCode: 201, message: "Invite created", data });
});

export const revokeInvite = asyncHandler(async (req, res) => {
  const data = await workspaceService.revokeInvite(
    req.user.id,
    req.params.workspaceId,
    req.params.inviteId
  );
  return sendSuccess(res, { message: "Invite revoked", data });
});

export const acceptInvite = asyncHandler(async (req, res) => {
  const data = await workspaceService.acceptInvite(req.user.id, req.body);
  return sendSuccess(res, { message: "Invite accepted", data });
});

export const listAudit = asyncHandler(async (req, res) => {
  const out = await workspaceService.listAuditLogs(req.user.id, req.params.workspaceId, req.query);
  return sendListSuccess(res, { message: "Audit log", ...out });
});

export const adminList = asyncHandler(async (req, res) => {
  const out = await workspaceService.adminListWorkspaces(req.query);
  return sendListSuccess(res, { message: "Workspaces", ...out });
});
