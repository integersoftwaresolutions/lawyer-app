import { CASE_VISIBILITY } from "../config/constants.js";
import { PERMISSIONS, hasPermission } from "../workspaces/permissions.catalog.js";

function idSet(...ids) {
  return new Set(ids.filter(Boolean).map((id) => String(id)));
}

function isAssigned(caseDoc, userId) {
  const uid = String(userId);
  if (String(caseDoc.primaryLawyerUserId) === uid) return true;
  return (caseDoc.collaboratorUserIds || []).some((id) => String(id) === uid);
}

function isRestrictedMember(caseDoc, userId) {
  return (caseDoc.restrictedMemberIds || []).some((id) => String(id) === String(userId));
}

/**
 * @param {object} caseDoc
 * @param {{ userId: string, isOwner: boolean, permissions: string[] }} ctx
 */
export function canViewCase(caseDoc, ctx) {
  const { userId, isOwner, permissions } = ctx;
  if (isOwner) return true;
  if (!hasPermission(permissions, PERMISSIONS.CASES_VIEW)) return false;

  const visibility = caseDoc.visibility || CASE_VISIBILITY.PRIVATE;
  if (visibility === CASE_VISIBILITY.FIRM) return true;

  if (visibility === CASE_VISIBILITY.RESTRICTED) {
    return (
      isAssigned(caseDoc, userId) ||
      isRestrictedMember(caseDoc, userId) ||
      String(caseDoc.createdByUserId) === String(userId)
    );
  }

  // PRIVATE
  return (
    isAssigned(caseDoc, userId) || String(caseDoc.createdByUserId) === String(userId)
  );
}

export function canEditCase(caseDoc, ctx) {
  if (!canViewCase(caseDoc, ctx)) return false;
  return ctx.isOwner || hasPermission(ctx.permissions, PERMISSIONS.CASES_EDIT);
}

export function canAssignCase(caseDoc, ctx) {
  if (!canViewCase(caseDoc, ctx)) return false;
  return ctx.isOwner || hasPermission(ctx.permissions, PERMISSIONS.CASES_ASSIGN);
}

export function canArchiveCase(caseDoc, ctx) {
  if (!canViewCase(caseDoc, ctx)) return false;
  return ctx.isOwner || hasPermission(ctx.permissions, PERMISSIONS.CASES_ARCHIVE);
}

export function canDeleteCase(caseDoc, ctx) {
  if (!canViewCase(caseDoc, ctx)) return false;
  return ctx.isOwner || hasPermission(ctx.permissions, PERMISSIONS.CASES_DELETE);
}

export function canManageNotes(caseDoc, ctx) {
  return canEditCase(caseDoc, ctx);
}

export function canAttachDocuments(caseDoc, ctx) {
  if (!canEditCase(caseDoc, ctx)) return false;
  return (
    ctx.isOwner ||
    hasPermission(ctx.permissions, PERMISSIONS.DOCS_UPLOAD) ||
    hasPermission(ctx.permissions, PERMISSIONS.DOCS_VIEW)
  );
}

/** Mongo filter fragment for list queries — caller ANDs with workspace base. */
export function buildVisibilityAccessFilter(userId, { isOwner }) {
  if (isOwner) return {};
  return {
    $or: [
      { visibility: CASE_VISIBILITY.FIRM },
      {
        visibility: CASE_VISIBILITY.PRIVATE,
        $or: [
          { primaryLawyerUserId: userId },
          { collaboratorUserIds: userId },
          { createdByUserId: userId }
        ]
      },
      {
        visibility: CASE_VISIBILITY.RESTRICTED,
        $or: [
          { primaryLawyerUserId: userId },
          { collaboratorUserIds: userId },
          { restrictedMemberIds: userId },
          { createdByUserId: userId }
        ]
      }
    ]
  };
}

export function buildScopeFilter(scope, userId) {
  if (scope === "mine") {
    return {
      $or: [{ primaryLawyerUserId: userId }, { collaboratorUserIds: userId }]
    };
  }
  if (scope === "firm") {
    return {
      visibility: { $in: [CASE_VISIBILITY.FIRM, CASE_VISIBILITY.RESTRICTED] }
    };
  }
  return {};
}

export function uniqueUserIds(...groups) {
  return [...idSet(...groups.flat())];
}
