import { useMemo } from "react";
import { useSelector } from "react-redux";
import {
  selectActiveWorkspace,
  selectWorkspacePermissions
} from "../store/slices/workspaceSlice";
import { hasAllPermissions, hasAnyPermission } from "../workspaces/permissions";

/** Active workspace + common flags. Owners already receive full permission arrays from the API. */
export function useWorkspace() {
  const workspace = useSelector(selectActiveWorkspace);
  const permissions = useSelector(selectWorkspacePermissions);
  const workspaceId = workspace?.id || null;

  return useMemo(
    () => ({
      workspace,
      workspaceId,
      permissions: permissions || [],
      isFirm: workspace?.type === "FIRM",
      isPersonal: workspace?.type === "PERSONAL",
      isOwner: Boolean(workspace?.membership?.isOwner),
      role: workspace?.membership?.role || null,
      loading: !workspace
    }),
    [workspace, permissions, workspaceId]
  );
}

/**
 * AND-check against active workspace permissions (mirrors backend requirePermission).
 * @param {string | string[]} keys
 */
export function usePermission(keys) {
  const permissions = useSelector(selectWorkspacePermissions);
  const list = Array.isArray(keys) ? keys : keys ? [keys] : [];
  return hasAllPermissions(permissions, list);
}

/**
 * OR-check against active workspace permissions.
 * @param {string | string[]} keys
 */
export function useAnyPermission(keys) {
  const permissions = useSelector(selectWorkspacePermissions);
  const list = Array.isArray(keys) ? keys : keys ? [keys] : [];
  return hasAnyPermission(permissions, list);
}
