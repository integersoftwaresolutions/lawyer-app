import { useCallback, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  FiAlertCircle,
  FiEye,
  FiFolder,
  FiPlus,
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
  PageFilters,
  PageHeader,
  PageShell,
  Pagination
} from "../../components/ui";
import DocumentUploadModal from "../../components/ai/DocumentUploadModal";
import RagDocumentViewModal from "../../components/ai/RagDocumentViewModal";
import { aiApi } from "../../services/ai.api";
import { getErrorMessage } from "../../utils/errorHandler";
import { usePermission } from "../../hooks/useWorkspaceAccess";
import { usePaginatedQuery } from "../../hooks/usePaginatedQuery";
import { PERMISSIONS } from "../../workspaces/permissions";

const STATUS_COLORS = {
  INDEXED: "success",
  ready: "success",
  PROCESSING: "info",
  processing: "info",
  PENDING: "warning",
  pending: "warning",
  FAILED: "danger",
  failed: "danger"
};

const VISIBILITY_COLORS = {
  PRIVATE: "secondary",
  FIRM: "info",
  PUBLIC: "success"
};

export default function LawyerDocumentsPage() {
  const activeWorkspaceId = useSelector((s) => s.workspace.activeWorkspaceId);
  const canManageVisibility = usePermission(PERMISSIONS.DOCS_MANAGE_VISIBILITY);
  const canUpload = usePermission(PERMISSIONS.DOCS_UPLOAD);
  const canDelete = usePermission(PERMISSIONS.DOCS_DELETE);

  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteDoc, setConfirmDeleteDoc] = useState(null);
  const [viewDocId, setViewDocId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchDocs = useCallback(
    (params) => {
      if (!activeWorkspaceId) return Promise.resolve({ items: [], meta: { page: 1, limit: 20, total: 0, pages: 1 } });
      return aiApi.listDocuments({
        ...params,
        ...(appliedSearch ? { q: appliedSearch } : {})
      });
    },
    [activeWorkspaceId, appliedSearch]
  );

  const { items, meta, setPage, loading, error, retry } = usePaginatedQuery(fetchDocs, {
    dependencies: [activeWorkspaceId, appliedSearch, refreshKey],
    defaultLimit: 20,
    enabled: !!activeWorkspaceId
  });

  const totalReady = useMemo(
    () => items.filter((d) => d.status === "INDEXED" || d.status === "ready").length,
    [items]
  );
  const totalChunks = useMemo(
    () => items.reduce((sum, d) => sum + (d.chunkCount || 0), 0),
    [items]
  );

  function handleSearchSubmit(e) {
    e.preventDefault();
    setAppliedSearch(search.trim());
  }

  async function handleUpload({ kind, payload }) {
    setUploadBusy(true);
    setActionError(null);
    try {
      if (kind === "file") await aiApi.ingestDocumentForm(payload);
      else await aiApi.ingestDocumentJson(payload);
      setUploadOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setUploadBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirmDeleteDoc) return;
    setDeletingId(confirmDeleteDoc.id);
    setActionError(null);
    try {
      await aiApi.deleteDocument(confirmDeleteDoc.id);
      setConfirmDeleteDoc(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleVisibilityChange(doc, visibility) {
    try {
      await aiApi.updateDocumentVisibility(doc.id, visibility);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  }

  const columns = [
    {
      key: "title",
      label: "Document",
      render: (_, doc) => (
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary m-0 truncate">{doc.title}</p>
          {doc.description ? (
            <p className="text-xs text-text-muted m-0 mt-0.5 line-clamp-1">{doc.description}</p>
          ) : null}
        </div>
      )
    },
    {
      key: "status",
      label: "Status",
      render: (value) => (
        <Badge variant={STATUS_COLORS[value] || "default"} size="sm">
          {(value || "").toLowerCase()}
        </Badge>
      )
    },
    {
      key: "visibility",
      label: "Visibility",
      render: (value, doc) =>
        canManageVisibility ? (
          <select
            className="h-8 text-xs rounded-md border border-input-border bg-input-background"
            value={value || "PRIVATE"}
            onChange={(e) => handleVisibilityChange(doc, e.target.value)}
            onClick={(e) => e.stopPropagation()}
          >
            <option value="PRIVATE">Private</option>
            <option value="FIRM">Firm</option>
            <option value="PUBLIC">Public</option>
          </select>
        ) : (
          <Badge variant={VISIBILITY_COLORS[value] || "default"} size="sm">
            {(value || "PRIVATE").toLowerCase()}
          </Badge>
        )
    },
    {
      key: "chunkCount",
      label: "Chunks",
      hideOnMobile: true,
      render: (value) => value || 0
    },
    {
      key: "createdAt",
      label: "Uploaded",
      hideOnMobile: true,
      render: (value) => (value ? new Date(value).toLocaleDateString() : "—")
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (_, doc) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => setViewDocId(doc.id)}
            className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-primary-light transition-colors"
            aria-label={`View ${doc.title}`}
          >
            <FiEye className="w-4 h-4" />
          </button>
          {canDelete && (
            <button
              type="button"
              onClick={() => setConfirmDeleteDoc(doc)}
              disabled={deletingId === doc.id}
              className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-danger-light disabled:opacity-50 transition-colors"
              aria-label={`Delete ${doc.title}`}
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <PageShell>
      <PageHeader
        icon={FiFolder}
        title="Documents"
        subtitle="Workspace knowledge base · Private, Firm, or Public visibility"
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
            {canUpload && (
              <Button icon={FiPlus} size="sm" onClick={() => setUploadOpen(true)}>
                Upload document
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Stat label="Documents" value={meta.total ?? items.length} />
        <Stat label="Indexed (page)" value={totalReady} accent="success" />
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
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row sm:items-end gap-3">
              <PageFilterField label="Search" className="flex-1 max-w-md">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by title or case ref…"
                    className="w-full h-9 pl-9 pr-3 rounded-md border border-input-border bg-input-background text-input-text text-sm outline-none focus:border-primary"
                  />
                </div>
              </PageFilterField>
              <PageFilterActions>
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
          emptyMessage={appliedSearch ? "No documents match your search" : "No documents yet"}
          emptyDescription={
            appliedSearch
              ? "Try a different search term."
              : "Upload briefs, judgments, or notes for AI retrieval."
          }
          emptyIcon={<FiFolder className="w-6 h-6" />}
        />
      </DataList>

      <DocumentUploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSubmit={handleUpload}
        busy={uploadBusy}
      />
      <RagDocumentViewModal
        isOpen={!!viewDocId}
        onClose={() => setViewDocId(null)}
        documentId={viewDocId}
        fetchDocument={aiApi.getDocument}
        variant="document"
      />
      <ConfirmModal
        isOpen={!!confirmDeleteDoc}
        onClose={() => setConfirmDeleteDoc(null)}
        onConfirm={handleDelete}
        title="Delete document permanently?"
        confirmLabel="Delete permanently"
        confirmVariant="danger"
        loading={!!confirmDeleteDoc && deletingId === confirmDeleteDoc.id}
      >
        <p className="text-text-secondary mt-0 mb-0">
          This will permanently delete{" "}
          <span className="font-semibold text-text-primary">&quot;{confirmDeleteDoc?.title}&quot;</span>{" "}
          and remove its indexed embeddings.
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
