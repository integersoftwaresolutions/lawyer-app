import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiBookOpen,
  FiPlus,
  FiEye,
  FiRefreshCcw,
  FiSearch,
  FiTrash2
} from "react-icons/fi";
import { Badge, Button, ConfirmModal, PageFilterActions, PageFilterField, PageFilterGrid, PageFilters, PageHeader, PageShell } from "../../components/ui";
import RagDocumentViewModal from "../../components/ai/RagDocumentViewModal";
import CaseLawUploadModal from "../../components/admin/CaseLawUploadModal";
import { adminRagApi } from "../../services/ai.api";
import { getErrorMessage } from "../../utils/errorHandler";

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
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ q: "", court: "", yearFrom: "", yearTo: "" });
  const [appliedFilters, setAppliedFilters] = useState({});
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState(null);
  const [viewItemId, setViewItemId] = useState(null);

  const totalIndexed = useMemo(() => items.filter((d) => d.status === "INDEXED").length, [items]);
  const totalChunks = useMemo(
    () => items.reduce((sum, d) => sum + (d.chunkCount || 0), 0),
    [items]
  );

  const load = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminRagApi.listCaseLaw({ limit: 50, ...params });
      setItems(res.data || []);
      setMeta(res.meta || { total: 0, page: 1, pages: 1 });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(appliedFilters);
  }, [load, appliedFilters]);

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
    setError(null);
    try {
      if (kind === "file") {
        await adminRagApi.ingestCaseLawForm(payload);
      } else {
        await adminRagApi.ingestCaseLawJson(payload);
      }
      setUploadOpen(false);
      await load(appliedFilters);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploadBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirmDeleteItem) return;
    setDeletingId(confirmDeleteItem.id);
    setError(null);
    try {
      await adminRagApi.deleteCaseLaw(confirmDeleteItem.id);
      setItems((prev) => prev.filter((d) => d.id !== confirmDeleteItem.id));
      setConfirmDeleteItem(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

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
              onClick={() => load(appliedFilters)}
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
        <Stat label="Indexed" value={totalIndexed} accent="success" />
        <Stat label="Indexed chunks" value={totalChunks} />
      </div>

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
                  <option key={c} value={c}>{c}</option>
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
            {(appliedFilters.q || appliedFilters.court || appliedFilters.yearFrom || appliedFilters.yearTo) && (
              <Button type="button" size="sm" variant="ghost" onClick={clearFilters}>
                Clear
              </Button>
            )}
          </PageFilterActions>
        </form>
      </PageFilters>

      {error && (
        <div className="flex items-start gap-2 rounded-lg p-3 text-sm bg-danger-light text-danger border border-danger">
          <FiAlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="break-words m-0">{error}</p>
          </div>
        </div>
      )}

      <div className="border border-card-border rounded-xl bg-card overflow-hidden shadow-sm">
        {loading ? (
          <SkeletonRows />
        ) : items.length === 0 ? (
          <EmptyState onUpload={() => setUploadOpen(true)} />
        ) : (
          <ul className="divide-y divide-card-border">
            {items.map((item) => (
              <li
                key={item.id}
                className="p-4 flex items-start gap-3 hover:bg-surface-hover transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary-light text-primary flex items-center justify-center shrink-0">
                  <FiBookOpen className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-text-primary truncate">{item.title}</h3>
                    <Badge variant={STATUS_COLORS[item.status] || "default"} size="sm">
                      {(item.status || "").toLowerCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-text-secondary flex-wrap">
                    <span className="font-medium">{item.court}</span>
                    {item.year && <span>· {item.year}</span>}
                    {item.citation && <span>· {item.citation}</span>}
                    {item.caseReference && <span>· {item.caseReference}</span>}
                    {item.subject && <span>· {item.subject}</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-text-muted flex-wrap">
                    <span>{item.chunkCount || 0} chunks</span>
                    {item.tokensIndexed > 0 && (
                      <span>· {item.tokensIndexed.toLocaleString()} tokens</span>
                    )}
                    {item.createdAt && (
                      <span>· added {new Date(item.createdAt).toLocaleDateString()}</span>
                    )}
                    {item.errorMessage && (
                      <span className="text-danger">· {item.errorMessage}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setViewItemId(item.id)}
                    className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                    aria-label={`View ${item.title}`}
                  >
                    <FiEye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteItem(item)}
                    disabled={deletingId === item.id}
                    className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 disabled:opacity-50 transition-colors"
                    aria-label={`Delete ${item.title}`}
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

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
          from
          the shared corpus and remove its embeddings from AI retrieval for all lawyers. This action
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
      <p className="text-[11px] uppercase tracking-wide font-semibold text-text-muted">{label}</p>
      <p className={`text-xl font-bold ${accentClass}`}>{value}</p>
    </div>
  );
}

function SkeletonRows() {
  return (
    <ul className="divide-y divide-card-border">
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-surface animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 rounded bg-surface animate-pulse" />
            <div className="h-2 w-1/2 rounded bg-surface animate-pulse" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function EmptyState({ onUpload }) {
  return (
    <div className="text-center py-12 px-6">
      <div className="w-12 h-12 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
        <FiBookOpen className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-text-primary mb-1">No judgments in the corpus yet</h3>
      <p className="text-sm text-text-secondary max-w-sm mx-auto mb-4">
        Add Supreme Court / High Court judgments so the AI assistant can cite them when lawyers
        research issues.
      </p>
      <Button onClick={onUpload} icon={FiPlus}>
        Ingest first judgment
      </Button>
    </div>
  );
}
