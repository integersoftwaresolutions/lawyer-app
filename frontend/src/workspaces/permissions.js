/**
 * Workspace permission catalog — mirrors backend/src/workspaces/permissions.catalog.js.
 * Use these keys everywhere (nav, routes, buttons) so UI stays aligned with API checks.
 */

export const PERMISSIONS = Object.freeze({
  MEMBERS_VIEW: "members.view",
  MEMBERS_INVITE: "members.invite",
  MEMBERS_REMOVE: "members.remove",
  MEMBERS_MANAGE_ROLES: "members.manage_roles",

  ROLES_MANAGE: "roles.manage",

  CASES_CREATE: "cases.create",
  CASES_EDIT: "cases.edit",
  CASES_DELETE: "cases.delete",
  CASES_ASSIGN: "cases.assign",
  CASES_ARCHIVE: "cases.archive",
  CASES_VIEW: "cases.view",
  CASES_EXPORT: "cases.export",

  DOCS_UPLOAD: "docs.upload",
  DOCS_VIEW: "docs.view",
  DOCS_DELETE: "docs.delete",
  DOCS_MANAGE_VISIBILITY: "docs.manage_visibility",

  BILLING_MANAGE: "billing.manage",
  BILLING_VIEW: "billing.view",

  AI_USE: "ai.use",

  WORKSPACE_SETTINGS: "workspace.settings",
  WORKSPACE_AUDIT: "workspace.audit"
});

export const ALL_PERMISSION_KEYS = Object.freeze(Object.values(PERMISSIONS));

/** True if `permissions` includes every key (AND). Empty keys → true. */
export function hasAllPermissions(permissions = [], keys = []) {
  if (!keys.length) return true;
  const set = permissions instanceof Set ? permissions : new Set(permissions);
  return keys.every((key) => set.has(key));
}

/** True if `permissions` includes any key (OR). Empty keys → false. */
export function hasAnyPermission(permissions = [], keys = []) {
  if (!keys.length) return false;
  const set = permissions instanceof Set ? permissions : new Set(permissions);
  return keys.some((key) => set.has(key));
}

/**
 * Whether a declarative nav/route item is allowed.
 * @param {{ requireFirm?: boolean, permissions?: string[] }} item
 * @param {{ isFirm: boolean, permissions: string[] }} ctx
 */
export function canAccessWorkspaceItem(item, { isFirm, permissions }) {
  if (item.requireFirm && !isFirm) return false;
  if (item.permissions?.length && !hasAllPermissions(permissions, item.permissions)) {
    return false;
  }
  return true;
}
