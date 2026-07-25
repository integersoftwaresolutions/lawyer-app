import { useCallback, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiBookOpen,
  FiPlus,
  FiEye,
  FiRefreshCcw,
  FiSearch,
  FiTrash2
} from "react-icons/fi";
import {
  Badge,
  Button,
  ConfirmModal,
  DataList,
  DataTable,
  PageFilterActions,
  PageFilterField,
  PageFilterGrid,
  PageFilters,
  PageHeader,
  PageShell,
  Pagination
} from "../../components/ui";
import RagDocumentViewModal from "../../components/ai/RagDocumentViewModal";
import CaseLawUploadModal from "../../components/admin/CaseLawUploadModal";
import { adminRagApi } from "../../services/ai.api";
import { getErrorMessage } from "../../utils/errorHandler";
import { usePaginatedQuery } from "../../hooks/usePaginatedQuery";

const COURTS = [
  "Supreme Court of Pakistan",
  "Federal Shariat Court",
  "Lahore High Court",
  "Sindh High Court",
  "Islamabad High Court",
  "Peshawar High Court",
  "Balochistan High Court",
  "Other"
];

const STATUS_COLORS = {
  INDEXED: "success",
  PROCESSING: "info",
  PENDING: "warning",
  FAILED: "danger"
};

export default function AdminCaseLawPage() {
  const [filters, setFilters] = useState({ q: "", court: "", yearFrom: "", yearTo: "" });
  const [appliedFilters, setAppliedFilters] = useState({});
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState(null);
  const [viewItemId, setViewItemId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchCaseLaw = useCallback(
    (params) => adminRagApi.listCaseLaw({ ...params, ...appliedFilters }),
    [appliedFilters]
  );

  const { items, meta, setPage, loading, error, retry } = usePaginatedQuery(fetchCaseLaw, {
    dependencies: [appliedFilters, refreshKey],
    defaultLimit: 20
  });

  const totalIndexed = useMemo(
    () => items.filter((d) => d.status === "INDEXED").length,
    [items]
  );
  const totalChunks = useMemo(
    () => items.reduce((sum, d) => sum + (d.chunkCount || 0), 0),
    [items]
  );

  function applyFilters(e) {
    e.preventDefault();
    const next = {};
    if (filters.q.trim()) next.q = filters.q.trim();
    if (filters.court) next.court = filters.court;
    if (filters.yearFrom) next.yearFrom = Number(filters.yearFrom);
    if (filters.yearTo) next.yearTo = Number(filters.yearTo);
    setAppliedFilters(next);
  }

  function clearFilters() {
    setFilters({ q: "", court: "", yearFrom: "", yearTo: "" });
    setAppliedFilters({});
  }

  async function handleUpload({ kind, payload }) {
    setUploadBusy(true);
    setActionError(null);
    try {
      if (kind === "file") {
        await adminRagApi.ingestCaseLawForm(payload);
      } else {
        await adminRagApi.ingestCaseLawJson(payload);
      }
      setUploadOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setUploadBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirmDeleteItem) return;
    setDeletingId(confirmDeleteItem.id);
    setActionError(null);
    try {
      await adminRagApi.deleteCaseLaw(confirmDeleteItem.id);
      setConfirmDeleteItem(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  const hasActiveFilters =
    appliedFilters.q || appliedFilters.court || appliedFilters.yearFrom || appliedFilters.yearTo;

  const columns = [
    {
      key: "title",
      label: "Judgment",
      render: (_, item) => (
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-text-primary m-0 truncate">{item.title}</p>
            <Badge variant={STATUS_COLORS[item.status] || "default"} size="sm">
              {(item.status || "").toLowerCase()}
            </Badge>
          </div>
          {(item.citation || item.caseReference || item.subject) && (
            <p className="text-xs text-text-muted m-0 mt-0.5 line-clamp-1">
              {[item.citation, item.caseReference, item.subject].filter(Boolean).join(" · ")}
            </p>
          )}
          {item.errorMessage && (
            <p className="text-xs text-danger m-0 mt-0.5">{item.errorMessage}</p>
          )}
        </div>
      )
    },
    {
      key: "court",
      label: "Court",
      hideOnMobile: true,
      render: (value) => value || "—"
    },
    {
      key: "year",
      label: "Year",
      hideOnMobile: true,
      render: (value) => value || "—"
    },
    {
      key: "chunkCount",
      label: "Chunks",
      hideOnMobile: true,
      render: (value, item) => (
        <span>
          {value || 0}
          {item.tokensIndexed > 0 ? ` · ${item.tokensIndexed.toLocaleString()} tokens` : ""}
        </span>
      )
    },
    {
      key: "createdAt",
      label: "Added",
      hideOnMobile: true,
      render: (value) => (value ? new Date(value).toLocaleDateString() : "—")
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (_, item) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => setViewItemId(item.id)}
            className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-primary-light transition-colors"
            aria-label={`View ${item.title}`}
          >
            <FiEye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setConfirmDeleteItem(item)}
            disabled={deletingId === item.id}
            className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-danger-light disabled:opacity-50 transition-colors"
            aria-label={`Delete ${item.title}`}
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <PageShell>
      <PageHeader
        icon={FiBookOpen}
        title="Case Law"
        subtitle="Pakistani judgment corpus · shared across all lawyer accounts"
        actions={
          <>
            <Button
              variant="secondary"
              icon={FiRefreshCcw}
              size="sm"
              onClick={() => setRefreshKey((k) => k + 1)}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button icon={FiPlus} size="sm" onClick={() => setUploadOpen(true)}>
              Ingest judgment
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Stat label="Judgments" value={meta.total ?? items.length} />
        <Stat label="Indexed (page)" value={totalIndexed} accent="success" />
        <Stat label="Chunks (page)" value={totalChunks} />
      </div>

      {(actionError || (typeof error === "string" ? error : null)) && (
        <div className="flex items-start gap-2 rounded-lg p-3 text-sm bg-danger-light text-danger border border-danger">
          <FiAlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="break-words m-0 flex-1">{actionError || getErrorMessage(error)}</p>
        </div>
      )}

      <DataList
        filters={
          <PageFilters>
            <form onSubmit={applyFilters}>
              <PageFilterGrid columns={5}>
                <PageFilterField label="Search" className="lg:col-span-2">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      value={filters.q}
                      onChange={(e) => setFilters({ ...filters, q: e.target.value })}
                      placeholder="Title, citation, case reference…"
                      className="w-full h-9 pl-9 pr-3 rounded-md border border-input-border bg-input-background text-input-text text-sm outline-none focus:border-primary"
                    />
                  </div>
                </PageFilterField>
                <PageFilterField label="Court">
                  <select
                    value={filters.court}
                    onChange={(e) => setFilters({ ...filters, court: e.target.value })}
                    className="w-full h-9 px-2 rounded-md border border-input-border bg-input-background text-input-text text-sm outline-none"
                  >
                    <option value="">Any</option>
                    {COURTS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </PageFilterField>
                <PageFilterField label="Year from">
                  <input
                    type="number"
                    value={filters.yearFrom}
                    onChange={(e) => setFilters({ ...filters, yearFrom: e.target.value })}
                    min={1900}
                    max={2100}
                    className="w-full h-9 px-2 rounded-md border border-input-border bg-input-background text-input-text text-sm outline-none"
                  />
                </PageFilterField>
                <PageFilterField label="Year to">
                  <input
                    type="number"
                    value={filters.yearTo}
                    onChange={(e) => setFilters({ ...filters, yearTo: e.target.value })}
                    min={1900}
                    max={2100}
                    className="w-full h-9 px-2 rounded-md border border-input-border bg-input-background text-input-text text-sm outline-none"
                  />
                </PageFilterField>
              </PageFilterGrid>
              <PageFilterActions className="mt-3">
                <Button type="submit" size="sm" variant="secondary">
                  Apply filters
                </Button>
                {hasActiveFilters && (
                  <Button type="button" size="sm" variant="ghost" onClick={clearFilters}>
                    Clear
                  </Button>
                )}
              </PageFilterActions>
            </form>
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
          emptyMessage={hasActiveFilters ? "No judgments match your filters" : "No judgments in the corpus yet"}
          emptyDescription={
            hasActiveFilters
              ? "Try different search terms or filter values."
              : "Add Supreme Court / High Court judgments so the AI assistant can cite them when lawyers research issues."
          }
          emptyIcon={<FiBookOpen className="w-6 h-6" />}
        />
      </DataList>

      <CaseLawUploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSubmit={handleUpload}
        busy={uploadBusy}
      />
      <RagDocumentViewModal
        isOpen={!!viewItemId}
        onClose={() => setViewItemId(null)}
        documentId={viewItemId}
        fetchDocument={adminRagApi.getCaseLaw}
        variant="case-law"
      />
      <ConfirmModal
        isOpen={!!confirmDeleteItem}
        onClose={() => setConfirmDeleteItem(null)}
        onConfirm={handleDelete}
        title="Delete case law entry permanently?"
        confirmLabel="Delete permanently"
        confirmVariant="danger"
        loading={!!confirmDeleteItem && deletingId === confirmDeleteItem.id}
      >
        <p className="text-text-secondary mt-0 mb-0">
          This will permanently delete{" "}
          <span className="font-semibold text-text-primary">&quot;{confirmDeleteItem?.title}&quot;</span>{" "}
          from the shared corpus and remove its embeddings from AI retrieval for all lawyers. This action
          cannot be undone.
        </p>
      </ConfirmModal>
    </PageShell>
  );
}

function Stat({ label, value, accent = "default" }) {
  const accentClass = accent === "success" ? "text-success" : "text-text-primary";
  return (
    <div className="rounded-xl border border-card-border bg-card p-3">
      <p className="text-[11px] uppercase tracking-wide font-semibold text-text-muted m-0">{label}</p>
      <p className={`text-xl font-bold m-0 ${accentClass}`}>{value}</p>
    </div>
  );
}
