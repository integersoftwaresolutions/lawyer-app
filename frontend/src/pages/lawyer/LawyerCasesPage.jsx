import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { FiPlus, FiSearch, FiBriefcase } from "react-icons/fi";
import {
  Badge,
  Button,
  DataList,
  DataTable,
  PageFilterField,
  PageFilters,
  PageHeader,
  PageShell,
  PageTabFilters,
  Pagination,
  Switch
} from "../../components/ui";
import CaseCreateModal from "../../components/cases/CaseCreateModal";
import { casesApi } from "../../services/cases.api";
import { usePaginatedQuery } from "../../hooks/usePaginatedQuery";
import { usePermission } from "../../hooks/useWorkspaceAccess";
import { PERMISSIONS } from "../../workspaces/permissions";

const SCOPE_OPTIONS = [
  { value: "mine", label: "My cases" },
  { value: "firm", label: "Firm shared" },
  { value: "all", label: "All accessible" }
];

const STATUS_VARIANT = {
  INTAKE: "info",
  ACTIVE: "success",
  ON_HOLD: "warning",
  CLOSED: "secondary",
  ARCHIVED: "default"
};

const PRIORITY_VARIANT = {
  LOW: "secondary",
  MEDIUM: "info",
  HIGH: "warning",
  URGENT: "danger"
};

export default function LawyerCasesPage() {
  const navigate = useNavigate();
  const activeWorkspaceId = useSelector((s) => s.workspace.activeWorkspaceId);
  const canCreate = usePermission(PERMISSIONS.CASES_CREATE);

  const [scope, setScope] = useState("mine");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const filtersActive = Boolean(search.trim() || status || priority || includeArchived);

  function clearFilters() {
    setSearch("");
    setDebouncedSearch("");
    setStatus("");
    setPriority("");
    setIncludeArchived(false);
  }

  const fetchCases = useCallback(
    (params) => {
      if (!activeWorkspaceId) {
        return Promise.resolve({ items: [], meta: { page: 1, limit: 20, total: 0, pages: 1 } });
      }
      return casesApi.list({
        ...params,
        scope,
        includeArchived: includeArchived || undefined,
        status: status || undefined,
        priority: priority || undefined,
        ...(debouncedSearch ? { q: debouncedSearch } : {})
      });
    },
    [activeWorkspaceId, scope, includeArchived, status, priority, debouncedSearch]
  );

  const { items, meta, setPage, loading, error, retry } = usePaginatedQuery(fetchCases, {
    dependencies: [activeWorkspaceId, scope, includeArchived, status, priority, debouncedSearch, refreshKey],
    defaultLimit: 20,
    enabled: !!activeWorkspaceId
  });

  const columns = [
    {
      key: "name",
      label: "Case",
      render: (_, row) => (
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary m-0 truncate">{row.name}</p>
          <p className="text-xs text-text-muted m-0 mt-0.5">
            {[row.type?.replace(/_/g, " "), row.caseNumber].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>
      )
    },
    {
      key: "status",
      label: "Status",
      render: (value) => (
        <Badge variant={STATUS_VARIANT[value] || "default"} size="sm">
          {(value || "").replace(/_/g, " ")}
        </Badge>
      )
    },
    {
      key: "priority",
      label: "Priority",
      render: (value) => (
        <Badge variant={PRIORITY_VARIANT[value] || "default"} size="sm">
          {value || "—"}
        </Badge>
      )
    },
    {
      key: "visibility",
      label: "Visibility",
      hideOnMobile: true,
      render: (value) => (
        <span className="text-xs text-text-muted">{(value || "PRIVATE").toLowerCase()}</span>
      )
    },
    {
      key: "nextHearingAt",
      label: "Next hearing",
      hideOnMobile: true,
      render: (value) => (value ? new Date(value).toLocaleDateString() : "—")
    },
    {
      key: "updatedAt",
      label: "Updated",
      hideOnMobile: true,
      render: (value) => (value ? new Date(value).toLocaleDateString() : "—")
    }
  ];

  return (
    <PageShell>
      <PageHeader
        title="Cases"
        subtitle="Matter repository for the active workspace"
        icon={FiBriefcase}
        actions={
          canCreate ? (
            <Button variant="primary" size="sm" icon={FiPlus} onClick={() => setCreateOpen(true)}>
              New case
            </Button>
          ) : null
        }
      />

      <DataList
        filters={
          <PageFilters>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <PageTabFilters options={SCOPE_OPTIONS} value={scope} onChange={setScope} />
              {filtersActive && (
                <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
              <PageFilterField label="Search">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    className="w-full h-10 pl-9 pr-3 rounded-md border border-input-border bg-input-background text-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Name, number, tags…"
                  />
                </div>
              </PageFilterField>
              <PageFilterField label="Status">
                <select
                  className="w-full h-10 rounded-md border border-input-border bg-input-background text-sm px-3"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="">All</option>
                  {["INTAKE", "ACTIVE", "ON_HOLD", "CLOSED", "ARCHIVED"].map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </PageFilterField>
              <PageFilterField label="Priority">
                <select
                  className="w-full h-10 rounded-md border border-input-border bg-input-background text-sm px-3"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="">All</option>
                  {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </PageFilterField>
              <PageFilterField label="Show archived">
                <div className="flex h-10 items-center">
                  <Switch
                    checked={includeArchived}
                    onChange={setIncludeArchived}
                    label="Show archived"
                  />
                </div>
              </PageFilterField>
            </div>
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
          emptyMessage="No cases yet"
          emptyDescription={
            canCreate
              ? "Create your first matter to track work, notes, and documents."
              : "No cases match this view."
          }
          emptyIcon={<FiBriefcase className="w-6 h-6" />}
          onRowClick={(row) => navigate(`/lawyer/cases/${row.id}`)}
        />
      </DataList>

      <CaseCreateModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(created) => {
          setRefreshKey((k) => k + 1);
          const id = created?.id || created?.data?.id;
          if (id) navigate(`/lawyer/cases/${id}`);
        }}
      />
    </PageShell>
  );
}
