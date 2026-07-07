import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiFile,
  FiFolder,
  FiPlus,
  FiRefreshCcw,
  FiSearch,
  FiTrash2
} from "react-icons/fi";
import { Badge, Button, Input } from "../../components/ui";
import DocumentUploadModal from "../../components/ai/DocumentUploadModal";
import { aiApi } from "../../services/ai.api";
import { getErrorMessage } from "../../utils/errorHandler";

const STATUS_COLORS = {
  ready: "success",
  processing: "info",
  pending: "warning",
  failed: "danger"
};

export default function LawyerDocumentsPage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const totalReady = useMemo(() => items.filter((d) => d.status === "ready").length, [items]);
  const totalChunks = useMemo(
    () => items.reduce((sum, d) => sum + (d.chunkCount || 0), 0),
    [items]
  );

  const load = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await aiApi.listDocuments({ limit: 50, ...params });
      setItems(res.data || []);
      setMeta(res.meta || { total: 0, page: 1, pages: 1 });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(appliedSearch ? { q: appliedSearch } : {});
  }, [load, appliedSearch]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setAppliedSearch(search.trim());
  }

  async function handleUpload({ kind, payload }) {
    setUploadBusy(true);
    setError(null);
    try {
      if (kind === "file") {
        await aiApi.ingestDocumentForm(payload);
      } else {
        await aiApi.ingestDocumentJson(payload);
      }
      setUploadOpen(false);
      await load(appliedSearch ? { q: appliedSearch } : {});
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploadBusy(false);
    }
  }

  async function handleDelete(doc) {
    if (!window.confirm(`Delete "${doc.title}"? This will also remove its embeddings.`)) return;
    setDeletingId(doc.id);
    setError(null);
    try {
      await aiApi.deleteDocument(doc.id);
      setItems((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
            <FiFolder className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-text-primary truncate">My Documents</h1>
            <p className="text-xs text-text-muted">
              Private knowledge base · indexed for AI retrieval
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            icon={FiRefreshCcw}
            size="sm"
            onClick={() => load(appliedSearch ? { q: appliedSearch } : {})}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button icon={FiPlus} size="sm" onClick={() => setUploadOpen(true)}>
            Upload document
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Stat label="Documents" value={meta.total ?? items.length} />
        <Stat label="Ready" value={totalReady} accent="success" />
        <Stat label="Indexed chunks" value={totalChunks} />
      </div>

      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or case ref…"
            className="w-full h-9 pl-9 pr-3 rounded-md border border-input-border bg-input-background text-sm outline-none focus:border-primary/50"
          />
        </div>
        <Button type="submit" variant="secondary" size="sm">
          Search
        </Button>
        {appliedSearch && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setAppliedSearch("");
            }}
          >
            Clear
          </Button>
        )}
      </form>

      {error && (
        <div className="flex items-start gap-2 rounded-lg p-3 text-sm bg-danger/10 text-danger border border-danger/20">
          <FiAlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="break-words">{error}</p>
          </div>
        </div>
      )}

      <div className="border border-card-border rounded-xl bg-card overflow-hidden">
        {loading ? (
          <SkeletonRows />
        ) : items.length === 0 ? (
          <EmptyState onUpload={() => setUploadOpen(true)} hasSearch={!!appliedSearch} />
        ) : (
          <ul className="divide-y divide-card-border">
            {items.map((doc) => (
              <li key={doc.id} className="p-4 flex items-start gap-3 hover:bg-surface-hover/40 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <FiFile className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-text-primary truncate">{doc.title}</h3>
                    <Badge variant={STATUS_COLORS[doc.status] || "default"} size="sm">
                      {doc.status}
                    </Badge>
                    {doc.caseRef && (
                      <span className="text-[11px] text-text-muted">· {doc.caseRef}</span>
                    )}
                  </div>
                  {doc.description && (
                    <p className="text-xs text-text-secondary mt-1 line-clamp-2">{doc.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-text-muted flex-wrap">
                    <span>{doc.chunkCount || 0} chunks</span>
                    {doc.tokensIndexed > 0 && (
                      <span>· {doc.tokensIndexed.toLocaleString()} tokens</span>
                    )}
                    {doc.createdAt && (
                      <span>· uploaded {new Date(doc.createdAt).toLocaleDateString()}</span>
                    )}
                    {doc.errorMessage && (
                      <span className="text-danger">· {doc.errorMessage}</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(doc)}
                  disabled={deletingId === doc.id}
                  className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 disabled:opacity-50 transition-colors shrink-0"
                  aria-label={`Delete ${doc.title}`}
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <DocumentUploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSubmit={handleUpload}
        busy={uploadBusy}
      />
    </div>
  );
}

function Stat({ label, value, accent = "default" }) {
  const accentClass =
    accent === "success"
      ? "text-success"
      : accent === "warning"
        ? "text-warning"
        : "text-text-primary";
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

function EmptyState({ onUpload, hasSearch }) {
  return (
    <div className="text-center py-12 px-6">
      <div className="w-12 h-12 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
        <FiFolder className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-text-primary mb-1">
        {hasSearch ? "No documents match your search" : "Upload your first document"}
      </h3>
      <p className="text-sm text-text-secondary max-w-sm mx-auto mb-4">
        Add briefs, judgments, contracts, or notes. The AI assistant will retrieve the right
        passages whenever you ask a question.
      </p>
      {!hasSearch && (
        <Button onClick={onUpload} icon={FiPlus}>
          Upload document
        </Button>
      )}
    </div>
  );
}
