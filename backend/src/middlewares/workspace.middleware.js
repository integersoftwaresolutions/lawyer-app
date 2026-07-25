import { ApiError } from "../helpers/apiError.js";
import User from "../models/User.js";
import { getActiveMembership, activateWorkspace } from "../services/workspace.service.js";
import { hasPermission } from "../workspaces/permissions.catalog.js";
import { ROLES } from "../config/constants.js";

/**
 * Resolve active workspace from X-Workspace-Id header or user.activeWorkspaceId.
 * Sets req.workspace, req.membership, req.role, req.permissions.
 */
export async function resolveActiveWorkspace(req, res, next) {
  try {
    if (!req.user) throw new ApiError(401, "Authentication required");
    if (req.user.role !== ROLES.LAWYER && req.user.role !== "LAWYER") {
      throw new ApiError(403, "Workspace context is only available for lawyers");
    }

    const headerId =
      req.headers["x-workspace-id"] ||
      req.headers["X-Workspace-Id"] ||
      null;
    const user = await User.findById(req.user.id).select("activeWorkspaceId isEmailVerified").lean();
    if (!user) throw new ApiError(401, "User not found");

    let workspaceId = headerId || (user.activeWorkspaceId ? String(user.activeWorkspaceId) : null);

    if (!workspaceId) {
      throw new ApiError(
        400,
        "No active workspace. Create or activate a workspace, or send X-Workspace-Id."
      );
    }

    let ctx = await getActiveMembership(req.user.id, workspaceId);

    // If stored active workspace is stale, try to recover via activate of personal later
    if (!ctx && !headerId && user.activeWorkspaceId) {
      throw new ApiError(403, "Active workspace membership is invalid. Switch workspace.");
    }
    if (!ctx) {
      throw new ApiError(403, "You are not a member of this workspace");
    }

    // Persist header selection as active
    if (headerId && String(user.activeWorkspaceId) !== String(workspaceId)) {
      await activateWorkspace(req.user.id, workspaceId);
      ctx = await getActiveMembership(req.user.id, workspaceId);
    }

    req.workspace = ctx.workspace;
    req.membership = ctx.membership;
    req.workspaceRole = ctx.role;
    req.permissions = ctx.permissions;
    next();
  } catch (err) {
    next(err);
  }
}

export function requirePermission(...keys) {
  const required = keys.flat();
  return (req, res, next) => {
    try {
      if (!req.permissions) {
        throw new ApiError(500, "Workspace context missing — use resolveActiveWorkspace first");
      }
      for (const key of required) {
        if (!hasPermission(req.permissions, key)) {
          throw new ApiError(403, `Missing permission: ${key}`);
        }
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

/** Email must be verified for workspace features (docs, AI, firm admin). */
export async function requireEmailVerified(req, res, next) {
  try {
    if (!req.user) throw new ApiError(401, "Authentication required");
    const user = await User.findById(req.user.id).select("isEmailVerified").lean();
    if (!user?.isEmailVerified) {
      throw new ApiError(403, "Please verify your email to access this feature");
    }
    next();
  } catch (err) {
    next(err);
  }
}
