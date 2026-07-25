import { useEffect, useState } from "react";
import { FiBriefcase, FiShield, FiUsers } from "react-icons/fi";
import { Badge, PageHeader, PageShell } from "../../../components/ui";
import { useWorkspace, usePermission } from "../../../hooks/useWorkspaceAccess";
import { workspaceApi } from "../../../services/workspace.api";
import { PERMISSIONS } from "../../../workspaces/permissions";
import { useToast } from "../../../hooks/useToast";
import { getErrorMessage } from "../../../utils/errorHandler";

export default function WorkspaceOverviewPage() {
  const toast = useToast();
  const { workspace, workspaceId, isFirm, isOwner } = useWorkspace();
  const canViewMembers = usePermission(PERMISSIONS.MEMBERS_VIEW);
  const [stats, setStats] = useState({ members: null, roles: null });

  useEffect(() => {
    if (!workspaceId || !isFirm || !canViewMembers) return;
    let cancelled = false;
    (async () => {
      try {
        const [m, r] = await Promise.all([
          workspaceApi.listMembers(workspaceId, { limit: 1 }),
          workspaceApi.listRoles(workspaceId, { limit: 1 })
        ]);
        if (!cancelled) {
          setStats({
            members: m.meta?.total ?? (m.items || []).length,
            roles: r.meta?.total ?? (r.items || []).length
          });
        }
      } catch (err) {
        toast.error(getErrorMessage(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workspaceId, isFirm, canViewMembers, toast]);

  if (!workspace) {
    return (
      <PageShell>
        <PageHeader icon={FiBriefcase} title="Workspace" subtitle="Loading your workspace…" />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        icon={FiBriefcase}
        title={workspace.name}
        subtitle={
          isFirm
            ? `Firm workspace · ${workspace.slug || "no slug"}`
            : "Personal practice workspace"
        }
        actions={<Badge variant={isFirm ? "info" : "secondary"}>{workspace.type}</Badge>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          icon={FiUsers}
          label="Members"
          value={isFirm ? stats.members ?? "—" : 1}
        />
        <StatCard
          icon={FiShield}
          label="Roles"
          value={isFirm ? stats.roles ?? "—" : "Owner"}
        />
        <StatCard
          icon={FiBriefcase}
          label="Your access"
          value={isOwner ? "Owner" : workspace.membership?.role?.name || "Member"}
        />
        {!isFirm && (
          <p className="sm:col-span-3 text-sm text-text-secondary m-0">
            Your personal workspace is for solo work. Create or join a firm from the workspace
            switcher to collaborate.
          </p>
        )}
      </div>
    </PageShell>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-card-border bg-card p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-primary-light text-primary flex items-center justify-center">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-wide text-text-muted font-semibold m-0">
          {label}
        </p>
        <p className="text-lg font-bold text-text-primary m-0">{value}</p>
      </div>
    </div>
  );
}
