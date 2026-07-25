import { useCallback, useEffect, useState } from "react";
import { FiCopy, FiUserPlus } from "react-icons/fi";
import {
  Button,
  DataList,
  DataTable,
  Input,
  PageHeader,
  PageShell,
  Pagination
} from "../../../components/ui";
import { useWorkspace } from "../../../hooks/useWorkspaceAccess";
import { workspaceApi } from "../../../services/workspace.api";
import { useToast } from "../../../hooks/useToast";
import { getErrorMessage } from "../../../utils/errorHandler";
import { usePaginatedQuery } from "../../../hooks/usePaginatedQuery";

export default function WorkspaceInvitesPage() {
  const toast = useToast();
  const { workspaceId } = useWorkspace();
  const [roles, setRoles] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchInvites = useCallback(
    (params) => {
      if (!workspaceId) {
        return Promise.resolve({ items: [], meta: { page: 1, limit: 20, total: 0, pages: 1 } });
      }
      return workspaceApi.listInvites(workspaceId, params);
    },
    [workspaceId]
  );

  const { items, meta, setPage, loading, error, retry } = usePaginatedQuery(fetchInvites, {
    dependencies: [workspaceId, refreshKey],
    defaultLimit: 20,
    enabled: !!workspaceId
  });

  useEffect(() => {
    if (!workspaceId) return;
    let cancelled = false;
    workspaceApi
      .listRoles(workspaceId, { limit: 50 })
      .then((r) => {
        if (cancelled) return;
        const roleList = r.items || [];
        setRoles(roleList);
        setInviteRoleId((prev) => {
          if (prev) return prev;
          if (!roleList.length) return "";
          const lawyer = roleList.find((x) => x.key === "LAWYER");
          return lawyer?.id || roleList[0].id;
        });
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

  async function createInvite({ email = null, maxUses = 25 } = {}) {
    if (!inviteRoleId) {
      toast.error("Select a role for the invite");
      return;
    }
    setBusy(true);
    try {
      const res = await workspaceApi.createInvite(workspaceId, {
        email: email || undefined,
        roleId: inviteRoleId,
        maxUses: email ? 1 : maxUses,
        expiresInDays: 14
      });
      toast.success(email ? "Invite email queued" : "Invite link created");
      if (!email && res.data?.token) {
        const url = `${window.location.origin}/lawyer/workspace/overview?invite=${res.data.token}`;
        await navigator.clipboard.writeText(url).catch(() => {});
        toast.success("Invite link copied");
      }
      setRefreshKey((k) => k + 1);
      setInviteEmail("");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleRevoke(inv) {
    try {
      await workspaceApi.revokeInvite(workspaceId, inv.id);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  const columns = [
    {
      key: "email",
      label: "Invite",
      render: (_, inv) => (
        <p className="text-sm font-medium text-text-primary m-0 truncate">
          {inv.email || "Link invite"}
        </p>
      )
    },
    {
      key: "status",
      label: "Status",
      render: (value) => value || "—"
    },
    {
      key: "useCount",
      label: "Uses",
      hideOnMobile: true,
      render: (_, inv) => `${inv.useCount}/${inv.maxUses}`
    },
    {
      key: "expiresAt",
      label: "Expires",
      hideOnMobile: true,
      render: (value) => (value ? new Date(value).toLocaleDateString() : "—")
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (_, inv) =>
        inv.status === "PENDING" ? (
          <Button size="xs" variant="danger" outline onClick={() => handleRevoke(inv)}>
            Revoke
          </Button>
        ) : null
    }
  ];

  return (
    <PageShell>
      <PageHeader icon={FiUserPlus} title="Invites" subtitle="Invite colleagues to this firm" />

      <div className="rounded-xl border border-card-border bg-card p-4 space-y-3 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Invite by email"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@firm.com"
          />
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Role</label>
            <select
              className="w-full h-10 px-2 rounded-md border border-input-border bg-input-background text-sm"
              value={inviteRoleId}
              onChange={(e) => setInviteRoleId(e.target.value)}
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            loading={busy}
            onClick={() => createInvite({ email: inviteEmail.trim() })}
            disabled={!inviteEmail.trim()}
          >
            Send email invite
          </Button>
          <Button
            size="sm"
            variant="secondary"
            icon={FiCopy}
            loading={busy}
            onClick={() => createInvite({})}
          >
            Copy invite link
          </Button>
        </div>
      </div>

      <DataList pagination={<Pagination meta={meta} onPageChange={setPage} />}>
        <DataTable
          columns={columns}
          data={items}
          keyField="id"
          loading={loading}
          error={error}
          retry={retry}
          emptyMessage="No invites yet"
          emptyDescription="Send an email invite or copy a shareable link above."
          emptyIcon={<FiUserPlus className="w-6 h-6" />}
        />
      </DataList>
    </PageShell>
  );
}
