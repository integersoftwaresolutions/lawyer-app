import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { FiUserMinus, FiUsers } from "react-icons/fi";
import { Button, DataList, DataTable, PageHeader, PageShell, Pagination } from "../../../components/ui";
import { useWorkspace, usePermission } from "../../../hooks/useWorkspaceAccess";
import { workspaceApi } from "../../../services/workspace.api";
import { fetchWorkspaces } from "../../../store/slices/workspaceSlice";
import { PERMISSIONS } from "../../../workspaces/permissions";
import { useToast } from "../../../hooks/useToast";
import { getErrorMessage } from "../../../utils/errorHandler";
import { usePaginatedQuery } from "../../../hooks/usePaginatedQuery";

export default function WorkspaceMembersPage() {
  const dispatch = useDispatch();
  const toast = useToast();
  const { workspaceId, isOwner } = useWorkspace();
  const canChangeRoles = usePermission(PERMISSIONS.MEMBERS_MANAGE_ROLES);
  const canRemove = usePermission(PERMISSIONS.MEMBERS_REMOVE);
  const [roles, setRoles] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchMembers = useCallback(
    (params) => {
      if (!workspaceId) {
        return Promise.resolve({ items: [], meta: { page: 1, limit: 20, total: 0, pages: 1 } });
      }
      return workspaceApi.listMembers(workspaceId, params);
    },
    [workspaceId]
  );

  const { items, meta, setPage, loading, error, retry } = usePaginatedQuery(fetchMembers, {
    dependencies: [workspaceId, refreshKey],
    defaultLimit: 20,
    enabled: !!workspaceId
  });

  useEffect(() => {
    if (!workspaceId || !canChangeRoles) {
      setRoles([]);
      return;
    }
    let cancelled = false;
    workspaceApi
      .listRoles(workspaceId, { limit: 50 })
      .then((r) => {
        if (!cancelled) setRoles(r.items || []);
      })
      .catch(async (err) => {
        const { isSessionExpiredError } = await import("../../../auth/sessionErrors");
        if (!cancelled && !isSessionExpiredError(err)) {
          toast.error(getErrorMessage(err));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceId, canChangeRoles, toast]);

  async function handleRoleChange(member, roleId) {
    try {
      await workspaceApi.changeMemberRole(workspaceId, member.userId, roleId);
      toast.success("Role updated");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleRemove(member) {
    try {
      await workspaceApi.removeMember(workspaceId, member.userId);
      toast.success("Member removed");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  const columns = [
    {
      key: "email",
      label: "Email",
      render: (_, m) => (
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary m-0 truncate">
            {m.email || m.userId}
          </p>
          {m.isOwner && <p className="text-xs text-text-muted m-0 mt-0.5">Owner</p>}
        </div>
      )
    },
    {
      key: "role",
      label: "Role",
      render: (_, m) =>
        m.isOwner ? (
          <span className="text-sm text-text-secondary">Owner</span>
        ) : canChangeRoles ? (
          <select
            className="h-8 text-xs rounded-md border border-input-border bg-input-background"
            value={m.role?.id || ""}
            onChange={(e) => handleRoleChange(m, e.target.value)}
            onClick={(e) => e.stopPropagation()}
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-sm text-text-secondary">{m.role?.name || "No role"}</span>
        )
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (_, m) =>
        !m.isOwner && canRemove ? (
          <button
            type="button"
            className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-danger-light"
            aria-label="Remove member"
            onClick={() => handleRemove(m)}
          >
            <FiUserMinus className="w-4 h-4" />
          </button>
        ) : null
    }
  ];

  return (
    <PageShell>
      <PageHeader icon={FiUsers} title="Members" subtitle="People in this firm" />

      <DataList pagination={<Pagination meta={meta} onPageChange={setPage} />}>
        <DataTable
          columns={columns}
          data={items}
          keyField="id"
          loading={loading}
          error={error}
          retry={retry}
          emptyMessage="No members found"
          emptyDescription="Invite colleagues to join this firm."
          emptyIcon={<FiUsers className="w-6 h-6" />}
        />
      </DataList>

      {!isOwner && (
        <div className="mt-4 rounded-xl border border-card-border bg-card p-4">
          <Button
            variant="danger"
            outline
            size="sm"
            onClick={async () => {
              try {
                await workspaceApi.leave(workspaceId);
                await dispatch(fetchWorkspaces());
                toast.success("Left firm");
              } catch (err) {
                toast.error(getErrorMessage(err));
              }
            }}
          >
            Leave firm
          </Button>
        </div>
      )}
    </PageShell>
  );
}
