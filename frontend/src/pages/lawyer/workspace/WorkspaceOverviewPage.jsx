import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiBriefcase, FiCreditCard, FiShield, FiUsers } from "react-icons/fi";
import { Badge, Button, PageHeader, PageShell } from "../../../components/ui";
import {
  useWorkspace,
  usePermission,
  useAnyPermission
} from "../../../hooks/useWorkspaceAccess";
import { workspaceApi } from "../../../services/workspace.api";
import { PERMISSIONS } from "../../../workspaces/permissions";
import { useToast } from "../../../hooks/useToast";
import { getErrorMessage } from "../../../utils/errorHandler";
import { BILLING_COMING_SOON } from "../../../config/features";

export default function WorkspaceOverviewPage() {
  const toast = useToast();
  const { workspace, workspaceId, isFirm, isOwner } = useWorkspace();
  const canViewBilling = useAnyPermission([
    PERMISSIONS.BILLING_VIEW,
    PERMISSIONS.BILLING_MANAGE
  ]);
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

      {canViewBilling ? (
        <div className="mt-6 rounded-xl border border-card-border bg-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary-light text-primary flex items-center justify-center shrink-0">
            <FiCreditCard className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-text-primary m-0">Billing</h3>
              {BILLING_COMING_SOON ? (
                <Badge variant="warning" size="sm">
                  Soon
                </Badge>
              ) : null}
            </div>
            <p className="text-sm text-text-secondary m-0 mt-1">
              {BILLING_COMING_SOON
                ? "Subscription and usage billing for this workspace is launching soon."
                : "Manage subscription, usage, and invoices for this workspace."}
            </p>
          </div>
          <Link to="/lawyer/billing/subscription" className="shrink-0 no-underline">
            <Button type="button" variant="secondary" size="sm">
              Open billing
            </Button>
          </Link>
        </div>
      ) : null}
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
