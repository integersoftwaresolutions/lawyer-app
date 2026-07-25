/**
 * Fixed permission catalog for workspaces.
 * Keys are stable — Phase 2/3 reuse cases.* and billing.* without schema changes.
 */

export const PERMISSIONS = Object.freeze({
  // Members
  MEMBERS_VIEW: "members.view",
  MEMBERS_INVITE: "members.invite",
  MEMBERS_REMOVE: "members.remove",
  MEMBERS_MANAGE_ROLES: "members.manage_roles",

  // Roles
  ROLES_MANAGE: "roles.manage",

  // Cases (Phase 2 — catalog ready)
  CASES_CREATE: "cases.create",
  CASES_EDIT: "cases.edit",
  CASES_DELETE: "cases.delete",
  CASES_ASSIGN: "cases.assign",
  CASES_ARCHIVE: "cases.archive",
  CASES_VIEW: "cases.view",
  CASES_EXPORT: "cases.export",

  // Documents
  DOCS_UPLOAD: "docs.upload",
  DOCS_VIEW: "docs.view",
  DOCS_DELETE: "docs.delete",
  DOCS_MANAGE_VISIBILITY: "docs.manage_visibility",

  // Billing (Phase 3)
  BILLING_MANAGE: "billing.manage",
  BILLING_VIEW: "billing.view",

  // AI
  AI_USE: "ai.use",

  // Workspace
  WORKSPACE_SETTINGS: "workspace.settings",
  WORKSPACE_AUDIT: "workspace.audit"
});

export const ALL_PERMISSION_KEYS = Object.freeze(Object.values(PERMISSIONS));

const P = PERMISSIONS;

/** Immutable system preset templates (copied into each firm on create). */
export const BUILTIN_ROLE_PRESETS = Object.freeze({
  ADMIN: Object.freeze({
    key: "ADMIN",
    name: "Admin",
    permissions: Object.freeze([
      P.MEMBERS_VIEW,
      P.MEMBERS_INVITE,
      P.MEMBERS_REMOVE,
      P.MEMBERS_MANAGE_ROLES,
      P.ROLES_MANAGE,
      P.CASES_CREATE,
      P.CASES_EDIT,
      P.CASES_DELETE,
      P.CASES_ASSIGN,
      P.CASES_ARCHIVE,
      P.CASES_VIEW,
      P.CASES_EXPORT,
      P.DOCS_UPLOAD,
      P.DOCS_VIEW,
      P.DOCS_DELETE,
      P.DOCS_MANAGE_VISIBILITY,
      P.BILLING_VIEW,
      P.AI_USE,
      P.WORKSPACE_SETTINGS,
      P.WORKSPACE_AUDIT
    ])
  }),
  LAWYER: Object.freeze({
    key: "LAWYER",
    name: "Lawyer",
    permissions: Object.freeze([
      P.MEMBERS_VIEW,
      P.CASES_CREATE,
      P.CASES_EDIT,
      P.CASES_ASSIGN,
      P.CASES_ARCHIVE,
      P.CASES_VIEW,
      P.CASES_EXPORT,
      P.DOCS_UPLOAD,
      P.DOCS_VIEW,
      P.DOCS_DELETE,
      P.DOCS_MANAGE_VISIBILITY,
      P.AI_USE
    ])
  }),
  PARALEGAL: Object.freeze({
    key: "PARALEGAL",
    name: "Paralegal",
    permissions: Object.freeze([
      P.MEMBERS_VIEW,
      P.CASES_VIEW,
      P.CASES_EDIT,
      P.DOCS_UPLOAD,
      P.DOCS_VIEW
    ])
  })
});

export function isValidPermissionKey(key) {
  return ALL_PERMISSION_KEYS.includes(key);
}

export function sanitizePermissionKeys(keys = []) {
  const set = new Set();
  for (const key of keys) {
    if (isValidPermissionKey(key)) set.add(key);
  }
  return [...set];
}

/**
 * Owner has every permission. Otherwise use role.permissions.
 */
export function expandPermissions({ isOwner, role }) {
  if (isOwner) return [...ALL_PERMISSION_KEYS];
  if (!role?.permissions?.length) return [];
  return sanitizePermissionKeys(role.permissions);
}

export function hasPermission(permissionSet, key) {
  if (!key) return false;
  if (Array.isArray(permissionSet)) return permissionSet.includes(key);
  if (permissionSet instanceof Set) return permissionSet.has(key);
  return false;
}
