import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/rbac.middleware.js";
import { requireEmailVerified } from "../middlewares/workspace.middleware.js";
import * as ctrl from "../controllers/workspace.controller.js";

const r = Router();

const lawyer = [authMiddleware, requireRoles("LAWYER"), requireEmailVerified];

r.get("/catalog/permissions", ...lawyer, ctrl.getCatalog);
r.get("/", ...lawyer, ctrl.listMine);
r.post("/", ...lawyer, ctrl.createFirm);
r.post("/invites/accept", ...lawyer, ctrl.acceptInvite);

r.post("/:workspaceId/activate", ...lawyer, ctrl.activate);
r.get("/:workspaceId", ...lawyer, ctrl.getOne);
r.patch("/:workspaceId", ...lawyer, ctrl.updateFirm);
r.delete("/:workspaceId", ...lawyer, ctrl.dissolve);
r.post("/:workspaceId/transfer", ...lawyer, ctrl.transfer);
r.post("/:workspaceId/leave", ...lawyer, ctrl.leave);

r.get("/:workspaceId/members", ...lawyer, ctrl.listMembers);
r.patch("/:workspaceId/members/:memberUserId/role", ...lawyer, ctrl.changeMemberRole);
r.delete("/:workspaceId/members/:memberUserId", ...lawyer, ctrl.removeMember);

r.get("/:workspaceId/roles", ...lawyer, ctrl.listRoles);
r.post("/:workspaceId/roles", ...lawyer, ctrl.createRole);
r.patch("/:workspaceId/roles/:roleId", ...lawyer, ctrl.updateRole);
r.delete("/:workspaceId/roles/:roleId", ...lawyer, ctrl.deleteRole);

r.get("/:workspaceId/invites", ...lawyer, ctrl.listInvites);
r.post("/:workspaceId/invites", ...lawyer, ctrl.createInvite);
r.delete("/:workspaceId/invites/:inviteId", ...lawyer, ctrl.revokeInvite);

r.get("/:workspaceId/audit", ...lawyer, ctrl.listAudit);

export default r;
