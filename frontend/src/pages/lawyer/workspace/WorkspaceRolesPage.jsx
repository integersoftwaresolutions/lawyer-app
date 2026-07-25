import { useCallback, useEffect, useState } from "react";
import { FiPlus, FiShield, FiTrash2 } from "react-icons/fi";
import {
  Badge,
  Button,
  DataList,
  DataTable,
  Input,
  Modal,
  PageHeader,
  PageShell,
  Pagination
} from "../../../components/ui";
import { useWorkspace } from "../../../hooks/useWorkspaceAccess";
import { workspaceApi } from "../../../services/workspace.api";
import { useToast } from "../../../hooks/useToast";
import { getErrorMessage } from "../../../utils/errorHandler";
import { usePaginatedQuery } from "../../../hooks/usePaginatedQuery";

const PERM_PREVIEW = 4;

export default function WorkspaceRolesPage() {
  const toast = useToast();
  const { workspaceId } = useWorkspace();
  const [catalog, setCatalog] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRolePerms, setNewRolePerms] = useState([]);
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [permsModal, setPermsModal] = useState({ open: false, role: null });

  const fetchRoles = useCallback(
    (params) => {
      if (!workspaceId) {
        return Promise.resolve({ items: [], meta: { page: 1, limit: 20, total: 0, pages: 1 } });
      }
      return workspaceApi.listRoles(workspaceId, params);
    },
    [workspaceId]
  );

  const { items, meta, setPage, loading, error, retry } = usePaginatedQuery(fetchRoles, {
    dependencies: [workspaceId, refreshKey],
    defaultLimit: 20,
    enabled: !!workspaceId
  });

  useEffect(() => {
    if (!workspaceId) return;
    let cancelled = false;
    workspaceApi
      .catalog()
      .then((c) => {
        if (!cancelled) setCatalog(c.data?.permissions || []);
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
  }, [workspaceId, toast]);

  function openCreateModal() {
    setNewRoleName("");
    setNewRolePerms([]);
    setCreateOpen(true);
  }

  function closeCreateModal() {
    if (busy) return;
    setCreateOpen(false);
    setNewRoleName("");
    setNewRolePerms([]);
  }

  async function handleCreateRole() {
    if (!newRoleName.trim()) {
      toast.error("Enter a role name");
      return;
    }
    setBusy(true);
    try {
      await workspaceApi.createRole(workspaceId, {
        name: newRoleName.trim(),
        permissions: newRolePerms
      });
      toast.success("Role created");
      closeCreateModal();
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteRole(role) {
    try {
      await workspaceApi.deleteRole(workspaceId, role.id);
      toast.success("Role deleted");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  const columns = [
    {
      key: "name",
      label: "Role",
      width: "180px",
      render: (_, r) => (
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-text-primary truncate">{r.name}</span>
          {r.isBuiltin ? <Badge size="sm" variant="success">Built in</Badge> : null}
        </div>
      )
    },
    {
      key: "permissions",
      label: "Permissions",
      render: (value, r) => {
        const perms = Array.isArray(value) ? value : [];
        if (!perms.length) {
          return <span className="text-xs text-text-muted">No permissions</span>;
        }
        const shown = perms.slice(0, PERM_PREVIEW);
        const rest = perms.length - shown.length;
        return (
          <div className="flex flex-wrap gap-1.5 items-center">
            {shown.map((p) => (
              <Badge key={p} size="sm" variant="info">
                {p}
              </Badge>
            ))}
            {rest > 0 ? (
              <button
                type="button"
                className="inline-flex items-center h-6 hover:underline text-[11px] font-medium text-primary transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setPermsModal({ open: true, role: r });
                }}
              >
                +{rest} more
              </button>
            ) : null}
          </div>
        );
      }
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      width: "88px",
      render: (_, r) =>
        !r.isBuiltin ? (
          <button
            type="button"
            className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-danger-light"
            aria-label={`Delete ${r.name}`}
            onClick={() => handleDeleteRole(r)}
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        ) : (
          <span className="text-xs text-text-muted">—</span>
        )
    }
  ];

  return (
    <PageShell>
      <PageHeader
        icon={FiShield}
        title="Roles"
        subtitle="Permissions for firm members"
        actions={
          <Button size="sm" icon={FiPlus} onClick={openCreateModal}>
            Create role
          </Button>
        }
      />

      <DataList pagination={<Pagination meta={meta} onPageChange={setPage} />}>
        <DataTable
          columns={columns}
          data={items}
          keyField="id"
          loading={loading}
          error={error}
          retry={retry}
          emptyMessage="No roles found"
          emptyDescription="Create a custom role to assign permissions to firm members."
          emptyIcon={<FiShield className="w-6 h-6" />}
        />
      </DataList>

      <Modal
        isOpen={permsModal.open}
        onClose={() => setPermsModal({ open: false, role: null })}
        title={permsModal.role ? `${permsModal.role.name} permissions` : "Permissions"}
        footer={
          <Button variant="secondary" onClick={() => setPermsModal({ open: false, role: null })}>
            Close
          </Button>
        }
      >
        <div className="flex flex-wrap gap-1.5 max-h-72 overflow-y-auto">
          {(permsModal.role?.permissions || []).length === 0 ? (
            <p className="text-sm text-text-muted m-0">No permissions</p>
          ) : (
            (permsModal.role?.permissions || []).map((p) => (
              <Badge key={p} size="sm" variant="primary">
                {p}
              </Badge>
            ))
          )}
        </div>
      </Modal>

      <Modal
        isOpen={createOpen}
        onClose={closeCreateModal}
        title="Create custom role"
        footer={
          <>
            <Button variant="secondary" onClick={closeCreateModal} disabled={busy}>
              Cancel
            </Button>
            <Button icon={FiPlus} onClick={handleCreateRole} loading={busy}>
              Create role
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Role name"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            placeholder="e.g. Associate"
            autoFocus
          />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted m-0 mb-2">
              Permissions
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto rounded-lg border border-card-border bg-surface p-3">
              {catalog.length === 0 ? (
                <p className="text-xs text-text-muted m-0 col-span-full">Loading permissions…</p>
              ) : (
                catalog.map((key) => (
                  <label key={key} className="flex items-center gap-2 text-xs text-text-secondary">
                    <input
                      type="checkbox"
                      checked={newRolePerms.includes(key)}
                      onChange={(e) => {
                        setNewRolePerms((prev) =>
                          e.target.checked ? [...prev, key] : prev.filter((k) => k !== key)
                        );
                      }}
                    />
                    <span className="font-mono">{key}</span>
                  </label>
                ))
              )}
            </div>
            {newRolePerms.length > 0 ? (
              <p className="text-[11px] text-text-muted m-0 mt-2">
                {newRolePerms.length} permission{newRolePerms.length === 1 ? "" : "s"} selected
              </p>
            ) : null}
          </div>
        </div>
      </Modal>
    </PageShell>
  );
}
