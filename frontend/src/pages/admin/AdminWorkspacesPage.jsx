import { useCallback, useState } from "react";
import { FiLayers } from "react-icons/fi";
import {
  Badge,
  DataList,
  DataTable,
  PageFilters,
  PageHeader,
  PageShell,
  PageTabFilters,
  Pagination
} from "../../components/ui";
import { adminWorkspaceApi } from "../../services/workspace.api";
import { usePaginatedQuery } from "../../hooks/usePaginatedQuery";

const TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "PERSONAL", label: "Personal" },
  { value: "FIRM", label: "Firm" }
];

export default function AdminWorkspacesPage() {
  const [type, setType] = useState("");

  const fetchWorkspaces = useCallback(
    (params) => adminWorkspaceApi.list({ ...params, ...(type ? { type } : {}) }),
    [type]
  );

  const { items, meta, setPage, loading, error, retry } = usePaginatedQuery(fetchWorkspaces, {
    dependencies: [type],
    defaultLimit: 20
  });

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric"
        })
      : "—";

  const columns = [
    {
      key: "name",
      label: "Name",
      render: (_, w) => (
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary m-0 truncate">{w.name}</p>
          {w.slug && <p className="text-xs text-text-muted m-0 mt-0.5">{w.slug}</p>}
        </div>
      )
    },
    {
      key: "type",
      label: "Type",
      render: (value) => (
        <Badge size="sm" variant={value === "FIRM" ? "info" : "secondary"}>
          {value}
        </Badge>
      )
    },
    {
      key: "memberCount",
      label: "Members",
      hideOnMobile: true,
      render: (value) => `${value ?? 0} member(s)`
    },
    {
      key: "city",
      label: "City",
      hideOnMobile: true,
      render: (value) => value || "—"
    },
    {
      key: "createdAt",
      label: "Created",
      hideOnMobile: true,
      render: (value) => formatDate(value)
    }
  ];

  return (
    <PageShell>
      <PageHeader
        icon={FiLayers}
        title="Workspaces"
        subtitle="Read-only directory of personal and firm workspaces"
      />
      <DataList
        filters={
          <PageFilters>
            <PageTabFilters options={TYPE_OPTIONS} value={type} onChange={setType} />
          </PageFilters>
        }
        pagination={<Pagination meta={meta} onPageChange={setPage} />}
      >
        <DataTable
          columns={columns}
          data={items}
          keyField="id"
          loading={loading}
          error={error}
          retry={retry}
          emptyMessage="No workspaces found"
          emptyDescription="Try a different workspace type filter."
          emptyIcon={<FiLayers className="w-6 h-6" />}
        />
      </DataList>
    </PageShell>
  );
}
