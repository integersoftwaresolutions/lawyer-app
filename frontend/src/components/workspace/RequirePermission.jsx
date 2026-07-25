import { Navigate } from "react-router-dom";
import { useWorkspace } from "../../hooks/useWorkspaceAccess";
import { canAccessWorkspaceItem } from "../../workspaces/permissions";

const DEFAULT_REDIRECT = "/lawyer/workspace/overview";

/**
 * Route / section gate — same semantics as backend requirePermission (+ optional firm scope).
 *
 * @example
 * <RequirePermission requireFirm permissions={[PERMISSIONS.MEMBERS_INVITE]}>
 *   <WorkspaceInvitesPage />
 * </RequirePermission>
 */
export default function RequirePermission({
  permissions = [],
  requireFirm = false,
  redirectTo = DEFAULT_REDIRECT,
  fallback = null,
  children
}) {
  const { workspace, isFirm, permissions: granted, loading } = useWorkspace();

  if (loading || !workspace) {
    return (
      <div className="p-6 text-sm text-text-muted" aria-busy="true">
        Loading workspace…
      </div>
    );
  }

  const ok = canAccessWorkspaceItem(
    { requireFirm, permissions },
    { isFirm, permissions: granted }
  );

  if (!ok) {
    if (fallback !== null) return fallback;
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
