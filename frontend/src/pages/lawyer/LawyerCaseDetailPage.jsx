import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  FiArchive,
  FiArrowLeft,
  FiCalendar,
  FiEye,
  FiFileText,
  FiInfo,
  FiLayers,
  FiLink,
  FiMessageSquare,
  FiMinusCircle,
  FiPlus,
  FiTrash2
} from "react-icons/fi";
import {
  Badge,
  Button,
  Card,
  ConfirmModal,
  Input,
  PageHeader,
  PageShell,
  Select,
  Spinner,
  StickySaveBar,
  Textarea
} from "../../components/ui";
import { FormSection } from "../auth/AuthLayout";
import DocumentUploadModal from "../../components/ai/DocumentUploadModal";
import RagDocumentViewModal from "../../components/ai/RagDocumentViewModal";
import CaseNotesPanel from "../../components/cases/CaseNotesPanel";
import CaseDetailTabs from "../../components/cases/CaseDetailTabs";
import { casesApi } from "../../services/cases.api";
import { aiApi } from "../../services/ai.api";
import { getErrorMessage } from "../../utils/errorHandler";
import { usePermission } from "../../hooks/useWorkspaceAccess";
import { useToast } from "../../hooks/useToast";
import { PERMISSIONS } from "../../workspaces/permissions";

const TABS = {
  OVERVIEW: "overview",
  NOTES: "notes",
  DOCUMENTS: "documents",
  BOOKING: "booking"
};

const STATUS_OPTIONS = ["INTAKE", "ACTIVE", "ON_HOLD", "CLOSED", "ARCHIVED"].map((s) => ({
  value: s,
  label: s.replace(/_/g, " ")
}));
const PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => ({
  value: p,
  label: p
}));
const TYPE_OPTIONS = ["CIVIL", "CRIMINAL", "FAMILY", "CORPORATE", "TAX", "LABOR", "OTHER"].map(
  (t) => ({ value: t, label: t.replace(/_/g, " ") })
);
const VISIBILITY_OPTIONS = ["PRIVATE", "FIRM", "RESTRICTED"].map((v) => ({
  value: v,
  label: v
}));

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

function emptyForm() {
  return {
    name: "",
    type: "CIVIL",
    typeCustom: "",
    priority: "MEDIUM",
    summary: "",
    description: "",
    tags: "",
    court: "",
    jurisdictionCity: "",
    caseNumber: "",
    openedAt: "",
    nextHearingAt: "",
    filingAt: "",
    visibility: "PRIVATE",
    parties: {
      client: { name: "", contact: "" },
      opponent: { name: "", counsel: "" },
      counsel: { name: "" }
    }
  };
}

function caseToForm(c) {
  return {
    name: c.name || "",
    type: c.type || "CIVIL",
    typeCustom: c.typeCustom || "",
    priority: c.priority || "MEDIUM",
    summary: c.summary || "",
    description: c.description || "",
    tags: (c.tags || []).join(", "),
    court: c.court || "",
    jurisdictionCity: c.jurisdictionCity || "",
    caseNumber: c.caseNumber || "",
    openedAt: c.openedAt ? String(c.openedAt).slice(0, 10) : "",
    nextHearingAt: c.nextHearingAt ? String(c.nextHearingAt).slice(0, 10) : "",
    filingAt: c.filingAt ? String(c.filingAt).slice(0, 10) : "",
    visibility: c.visibility || "PRIVATE",
    parties: {
      client: {
        name: c.parties?.client?.name || "",
        contact: c.parties?.client?.contact || ""
      },
      opponent: {
        name: c.parties?.opponent?.name || "",
        counsel: c.parties?.opponent?.counsel || ""
      },
      counsel: { name: c.parties?.counsel?.name || "" }
    }
  };
}

function applyCaseToState(c, setters) {
  const next = caseToForm(c);
  setters.setCaseData(c);
  setters.setForm(next);
  setters.setBaseline(JSON.stringify(next));
  setters.setNotes([...(c.notes || [])].reverse());
  setters.setBookingIdInput(c.bookingId ? String(c.bookingId) : "");
}

function ModuleEmpty({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-4 py-12 sm:py-16">
      <div className="w-12 h-12 rounded-xl bg-primary-light text-primary flex items-center justify-center mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-text-primary m-0 mb-1">{title}</h3>
      <p className="text-sm text-text-muted m-0 max-w-sm mb-4">{description}</p>
      {action}
    </div>
  );
}

export default function LawyerCaseDetailPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const canEdit = usePermission(PERMISSIONS.CASES_EDIT);
  const canArchive = usePermission(PERMISSIONS.CASES_ARCHIVE);
  const canDelete = usePermission(PERMISSIONS.CASES_DELETE);
  const canUpload = usePermission(PERMISSIONS.DOCS_UPLOAD);

  const tabParam = searchParams.get("tab");
  const activeTab = Object.values(TABS).includes(tabParam) ? tabParam : TABS.OVERVIEW;

  const [caseData, setCaseData] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [baseline, setBaseline] = useState("");
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [docs, setDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [libraryDocs, setLibraryDocs] = useState([]);
  const [linkDocId, setLinkDocId] = useState("");
  const [attachBusy, setAttachBusy] = useState(false);
  const [detachId, setDetachId] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [viewDocId, setViewDocId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [archiveBusy, setArchiveBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [bookingIdInput, setBookingIdInput] = useState("");
  const [bookingBusy, setBookingBusy] = useState(false);
  const [error, setError] = useState(null);

  const dirty = useMemo(() => JSON.stringify(form) !== baseline, [form, baseline]);

  const stateSetters = useMemo(
    () => ({ setCaseData, setForm, setBaseline, setNotes, setBookingIdInput }),
    []
  );

  const setTab = useCallback(
    (id) => {
      const next = new URLSearchParams(searchParams);
      if (id === TABS.OVERVIEW) next.delete("tab");
      else next.set("tab", id);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const loadDocs = useCallback(async () => {
    setDocsLoading(true);
    try {
      const docRes = await casesApi.listDocuments(caseId, { limit: 50 });
      setDocs(docRes.items || []);
    } catch {
      /* keep previous */
    } finally {
      setDocsLoading(false);
    }
  }, [caseId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await casesApi.get(caseId);
      const c = res.data || res;
      applyCaseToState(c, stateSetters);
      await loadDocs();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [caseId, loadDocs, stateSetters]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!canEdit) return;
    aiApi
      .listDocuments({ unlinked: true, limit: 50 })
      .then((res) => setLibraryDocs(res.items || []))
      .catch(() => {});
  }, [canEdit, caseId]);

  function patchForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function patchParty(group, key, value) {
    setForm((prev) => ({
      ...prev,
      parties: {
        ...prev.parties,
        [group]: { ...prev.parties[group], [key]: value }
      }
    }));
  }

  async function handleSave() {
    if (!canEdit || saving) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        typeCustom: form.type === "OTHER" ? form.typeCustom.trim() : "",
        priority: form.priority,
        summary: form.summary.trim(),
        description: form.description.trim(),
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        court: form.court || "",
        jurisdictionCity: form.jurisdictionCity.trim(),
        caseNumber: form.caseNumber.trim(),
        openedAt: form.openedAt || null,
        nextHearingAt: form.nextHearingAt || null,
        filingAt: form.filingAt || null,
        visibility: form.visibility,
        parties: form.parties
      };
      const res = await casesApi.update(caseId, payload);
      const c = res.data || res;
      const next = caseToForm(c);
      setCaseData((prev) => ({ ...prev, ...c, notes: prev?.notes }));
      setForm(next);
      setBaseline(JSON.stringify(next));
      toast.success("Case saved");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(status) {
    if (!canEdit || statusBusy || status === caseData?.status) return;
    setStatusBusy(true);
    try {
      const res = await casesApi.setStatus(caseId, status);
      const c = res.data || res;
      setCaseData((prev) => ({ ...prev, ...c, notes: prev?.notes }));
      toast.success("Status updated");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setStatusBusy(false);
    }
  }

  async function handleAttach() {
    if (!linkDocId || attachBusy) return;
    setAttachBusy(true);
    try {
      await casesApi.attachDocument(caseId, linkDocId);
      setLinkDocId("");
      setLibraryDocs((prev) => prev.filter((d) => d.id !== linkDocId));
      await loadDocs();
      toast.success("Document attached");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAttachBusy(false);
    }
  }

  async function handleDetach(documentId) {
    if (detachId) return;
    setDetachId(documentId);
    try {
      await casesApi.detachDocument(caseId, documentId);
      setDocs((prev) => prev.filter((d) => d.id !== documentId));
      toast.success("Document detached");
      aiApi
        .listDocuments({ unlinked: true, limit: 50 })
        .then((res) => setLibraryDocs(res.items || []))
        .catch(() => {});
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDetachId(null);
    }
  }

  async function handleUpload({ kind, payload }) {
    setUploadBusy(true);
    try {
      if (kind === "file") {
        if (payload instanceof FormData) payload.append("caseId", caseId);
        await aiApi.ingestDocumentForm(payload);
      } else {
        await aiApi.ingestDocumentJson({ ...payload, caseId });
      }
      setUploadOpen(false);
      await loadDocs();
      toast.success("Document uploaded");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploadBusy(false);
    }
  }

  async function handleBookingLink() {
    if (bookingBusy) return;
    setBookingBusy(true);
    try {
      const res = await casesApi.linkBooking(caseId, bookingIdInput.trim() || null);
      const c = res.data || res;
      setCaseData((prev) => ({ ...prev, ...c, notes: prev?.notes }));
      setBookingIdInput(c.bookingId ? String(c.bookingId) : "");
      toast.success(c.bookingId ? "Booking linked" : "Booking unlinked");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBookingBusy(false);
    }
  }

  async function handleArchive() {
    setArchiveBusy(true);
    try {
      const res = caseData?.isArchived
        ? await casesApi.restore(caseId)
        : await casesApi.archive(caseId);
      const c = res.data || res;
      setCaseData((prev) => ({ ...prev, ...c, notes: prev?.notes }));
      setConfirmArchive(false);
      toast.success(caseData?.isArchived ? "Case restored" : "Case archived");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setArchiveBusy(false);
    }
  }

  async function handleDelete() {
    setDeleteBusy(true);
    try {
      await casesApi.remove(caseId);
      toast.success("Case deleted");
      navigate("/lawyer/cases");
    } catch (err) {
      toast.error(getErrorMessage(err));
      setDeleteBusy(false);
    }
  }

  const tabItems = useMemo(
    () => [
      {
        id: TABS.OVERVIEW,
        label: "Overview",
        icon: FiInfo,
        dot: dirty
      },
      {
        id: TABS.NOTES,
        label: "Notes",
        icon: FiMessageSquare,
        count: notes.length
      },
      {
        id: TABS.DOCUMENTS,
        label: "Documents",
        icon: FiFileText,
        count: docs.length
      },
      {
        id: TABS.BOOKING,
        label: "Booking",
        icon: FiCalendar,
        count: caseData?.bookingId ? 1 : 0
      }
    ],
    [dirty, notes.length, docs.length, caseData?.bookingId]
  );

  if (loading) {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-text-muted">
          <Spinner className="w-8 h-8" />
          <p className="text-sm m-0">Loading case…</p>
        </div>
      </PageShell>
    );
  }

  if (error || !caseData) {
    return (
      <PageShell>
        <Card padding="p-6" className="max-w-lg">
          <p className="text-danger m-0 mb-4">{error || "Case not found"}</p>
          <Button variant="secondary" icon={FiArrowLeft} onClick={() => navigate("/lawyer/cases")}>
            Back to cases
          </Button>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        icon={FiLayers}
        title={caseData.name}
        subtitle={[
          caseData.type?.replace(/_/g, " "),
          caseData.visibility,
          caseData.caseNumber ? `#${caseData.caseNumber}` : null
        ]
          .filter(Boolean)
          .join(" · ")}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon={FiArrowLeft}
              onClick={() => navigate("/lawyer/cases")}
            >
              Back
            </Button>
            {canArchive && (
              <Button
                variant="secondary"
                size="sm"
                icon={FiArchive}
                onClick={() => setConfirmArchive(true)}
              >
                {caseData.isArchived ? "Restore" : "Archive"}
              </Button>
            )}
            {canDelete && (
              <Button
                variant="danger"
                size="sm"
                icon={FiTrash2}
                onClick={() => setConfirmDelete(true)}
              >
                Delete
              </Button>
            )}
          </div>
        }
      />

      <div>
        <div className="px-4 sm:px-6 pt-1">
          <CaseDetailTabs tabs={tabItems} value={activeTab} onChange={setTab} />
        </div>

        <div className="p-4 sm:p-6" role="tabpanel">
          {activeTab === TABS.OVERVIEW && (
            <div className="space-y-1">
              {canEdit && (
                <FormSection title="Workflow">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 rounded-xl border border-card-border bg-surface p-3 sm:p-4">
                    <Select
                      label="Status"
                      value={caseData.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      options={STATUS_OPTIONS}
                      disabled={statusBusy}
                      containerClassName="mb-0"
                    />
                    <Select
                      label="Priority"
                      value={form.priority}
                      onChange={(e) => patchForm("priority", e.target.value)}
                      options={PRIORITY_OPTIONS}
                      containerClassName="mb-0"
                    />
                    {statusBusy ? (
                      <p className="sm:col-span-2 text-xs text-text-muted m-0 mt-2 flex items-center gap-2">
                        <Spinner className="w-3.5 h-3.5" /> Updating status…
                      </p>
                    ) : (
                      <p className="sm:col-span-2 text-xs text-text-muted m-0 mt-2">
                        Status saves immediately. Priority saves with Overview.
                      </p>
                    )}
                  </div>
                </FormSection>
              )}

              <FormSection title="Basics">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                  <Input
                    label="Name"
                    value={form.name}
                    onChange={(e) => patchForm("name", e.target.value)}
                    disabled={!canEdit}
                  />
                  <Select
                    label="Type"
                    value={form.type}
                    onChange={(e) => patchForm("type", e.target.value)}
                    options={TYPE_OPTIONS}
                    disabled={!canEdit}
                  />
                  {form.type === "OTHER" && (
                    <Input
                      label="Custom type"
                      value={form.typeCustom}
                      onChange={(e) => patchForm("typeCustom", e.target.value)}
                      disabled={!canEdit}
                    />
                  )}
                  <Select
                    label="Visibility"
                    value={form.visibility}
                    onChange={(e) => patchForm("visibility", e.target.value)}
                    options={VISIBILITY_OPTIONS}
                    disabled={!canEdit}
                  />
                  <Input
                    label="Case number"
                    value={form.caseNumber}
                    onChange={(e) => patchForm("caseNumber", e.target.value)}
                    disabled={!canEdit}
                  />
                  <Input
                    label="Court"
                    value={form.court}
                    onChange={(e) => patchForm("court", e.target.value)}
                    disabled={!canEdit}
                    placeholder="e.g. Lahore High Court"
                  />
                  <Input
                    label="City / jurisdiction"
                    value={form.jurisdictionCity}
                    onChange={(e) => patchForm("jurisdictionCity", e.target.value)}
                    disabled={!canEdit}
                  />
                  <Input
                    label="Tags"
                    value={form.tags}
                    onChange={(e) => patchForm("tags", e.target.value)}
                    disabled={!canEdit}
                    placeholder="Comma-separated"
                  />
                </div>
              </FormSection>

              <FormSection title="Dates">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4">
                  <Input
                    label="Opened"
                    type="date"
                    value={form.openedAt}
                    onChange={(e) => patchForm("openedAt", e.target.value)}
                    disabled={!canEdit}
                  />
                  <Input
                    label="Next hearing"
                    type="date"
                    value={form.nextHearingAt}
                    onChange={(e) => patchForm("nextHearingAt", e.target.value)}
                    disabled={!canEdit}
                  />
                  <Input
                    label="Filing date"
                    type="date"
                    value={form.filingAt}
                    onChange={(e) => patchForm("filingAt", e.target.value)}
                    disabled={!canEdit}
                  />
                </div>
              </FormSection>

              <FormSection title="Summary">
                <Textarea
                  label="Brief summary"
                  value={form.summary}
                  onChange={(e) => patchForm("summary", e.target.value)}
                  rows={2}
                  disabled={!canEdit}
                />
                <Textarea
                  label="Description"
                  value={form.description}
                  onChange={(e) => patchForm("description", e.target.value)}
                  rows={4}
                  disabled={!canEdit}
                />
              </FormSection>

              <FormSection title="Parties">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                  <Input
                    label="Client name"
                    value={form.parties.client.name}
                    onChange={(e) => patchParty("client", "name", e.target.value)}
                    disabled={!canEdit}
                  />
                  <Input
                    label="Client contact"
                    value={form.parties.client.contact}
                    onChange={(e) => patchParty("client", "contact", e.target.value)}
                    disabled={!canEdit}
                  />
                  <Input
                    label="Opponent"
                    value={form.parties.opponent.name}
                    onChange={(e) => patchParty("opponent", "name", e.target.value)}
                    disabled={!canEdit}
                  />
                  <Input
                    label="Opponent counsel"
                    value={form.parties.opponent.counsel}
                    onChange={(e) => patchParty("opponent", "counsel", e.target.value)}
                    disabled={!canEdit}
                  />
                  <Input
                    label="Counsel note"
                    value={form.parties.counsel.name}
                    onChange={(e) => patchParty("counsel", "name", e.target.value)}
                    disabled={!canEdit}
                  />
                </div>
              </FormSection>

              {canEdit && (
                <StickySaveBar dirty={dirty} onSave={handleSave} loading={saving} />
              )}
            </div>
          )}

          {activeTab === TABS.NOTES && (
            <div>
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-text-primary m-0">Case notes</h2>
                <p className="text-sm text-text-muted m-0 mt-1">
                  Timeline of updates for this matter. Newest first.
                </p>
              </div>
              {!notes.length && !canEdit ? (
                <ModuleEmpty
                  icon={FiMessageSquare}
                  title="No notes yet"
                  description="Notes will appear here when someone on the case adds them."
                />
              ) : (
                <CaseNotesPanel
                  caseId={caseId}
                  notes={notes}
                  canEdit={canEdit}
                  onNotesChange={setNotes}
                  toast={toast}
                />
              )}
            </div>
          )}

          {activeTab === TABS.DOCUMENTS && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-lg font-semibold text-text-primary m-0">Documents</h2>
                  <p className="text-sm text-text-muted m-0 mt-1">
                    Files attached to this case. Library docs can be linked anytime.
                  </p>
                </div>
                {canUpload && (
                  <Button size="sm" icon={FiPlus} onClick={() => setUploadOpen(true)}>
                    Upload to case
                  </Button>
                )}
              </div>

              {canEdit && (
                <div className="flex flex-col sm:flex-row sm:items-end gap-2 mb-5 p-3 sm:p-4 rounded-xl border border-card-border bg-surface">
                  <Select
                    label="Link from library"
                    value={linkDocId}
                    onChange={(e) => setLinkDocId(e.target.value)}
                    options={libraryDocs.map((d) => ({ value: d.id, label: d.title }))}
                    placeholder={libraryDocs.length ? "Select document" : "No unlinked documents"}
                    containerClassName="mb-0 flex-1"
                    disabled={attachBusy || !libraryDocs.length}
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={FiLink}
                    loading={attachBusy}
                    disabled={!linkDocId || attachBusy}
                    onClick={handleAttach}
                  >
                    Attach
                  </Button>
                </div>
              )}

              {docsLoading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-text-muted text-sm">
                  <Spinner className="w-4 h-4" /> Loading documents…
                </div>
              ) : docs.length ? (
                <ul className="m-0 p-0 list-none divide-y divide-card-border rounded-xl border border-card-border overflow-hidden">
                  {docs.map((d) => (
                    <li
                      key={d.id}
                      className="flex items-center justify-between gap-3 px-3 sm:px-4 py-3 bg-card hover:bg-surface-hover transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-primary-light text-primary flex items-center justify-center shrink-0">
                          <FiFileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-primary m-0 truncate">
                            {d.title}
                          </p>
                          {d.visibility ? (
                            <p className="text-xs text-text-muted m-0 mt-0.5 capitalize">
                              {d.visibility.toLowerCase()}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-primary-light transition-colors"
                          aria-label={`View ${d.title}`}
                          onClick={() => setViewDocId(d.id)}
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                        {canEdit && (
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={FiMinusCircle}
                            loading={detachId === d.id}
                            onClick={() => handleDetach(d.id)}
                          >
                            Detach
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <ModuleEmpty
                  icon={FiFileText}
                  title="No documents attached"
                  description="Upload a file to this case or link one from your workspace library."
                  action={
                    canUpload ? (
                      <Button size="sm" icon={FiPlus} onClick={() => setUploadOpen(true)}>
                        Upload document
                      </Button>
                    ) : null
                  }
                />
              )}

              <p className="text-xs text-text-muted mt-4 mb-0">
                Browse the full library in{" "}
                <Link to="/lawyer/documents" className="text-link hover:underline">
                  Documents
                </Link>
                .
              </p>
            </div>
          )}

          {activeTab === TABS.BOOKING && (
            <div>
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-text-primary m-0">Booking link</h2>
                <p className="text-sm text-text-muted m-0 mt-1">
                  Optionally connect this matter to an existing consultation booking.
                </p>
              </div>

              <div className="rounded-xl border border-card-border bg-surface p-4 sm:p-5 max-w-xl">
                {caseData.bookingId ? (
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-success-light text-success flex items-center justify-center shrink-0">
                      <FiLink className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-primary m-0">Linked booking</p>
                      <p className="text-xs text-text-muted m-0 mt-1 font-mono break-all">
                        {String(caseData.bookingId)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary-light text-primary flex items-center justify-center shrink-0">
                      <FiCalendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary m-0">No booking linked</p>
                      <p className="text-xs text-text-muted m-0 mt-1">
                        Paste a booking ID from Bookings to connect it.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 items-end">
                  <Input
                    label="Booking ID"
                    value={bookingIdInput}
                    onChange={(e) => setBookingIdInput(e.target.value)}
                    disabled={!canEdit || bookingBusy}
                    placeholder="Paste booking ObjectId"
                    containerClassName="mb-0 flex-1"
                  />
                  {canEdit && (
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={bookingBusy}
                      onClick={handleBookingLink}
                    >
                      {bookingIdInput.trim() ? "Save link" : "Clear link"}
                    </Button>
                  )}
                </div>
                <p className="text-xs text-text-muted m-0 mt-3">
                  Bookings never auto-create cases.{" "}
                  <Link to="/lawyer/bookings" className="text-link hover:underline">
                    Open bookings
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <DocumentUploadModal
        isOpen={uploadOpen}
        onClose={() => !uploadBusy && setUploadOpen(false)}
        onSubmit={handleUpload}
        busy={uploadBusy}
        initialCaseId={caseId}
      />
      <RagDocumentViewModal
        isOpen={!!viewDocId}
        onClose={() => setViewDocId(null)}
        documentId={viewDocId}
        fetchDocument={aiApi.getDocument}
      />
      <ConfirmModal
        isOpen={confirmArchive}
        onClose={() => !archiveBusy && setConfirmArchive(false)}
        onConfirm={handleArchive}
        title={caseData.isArchived ? "Restore case?" : "Archive case?"}
        message={
          caseData.isArchived
            ? "This case will appear in default repository lists again."
            : "Archived cases are hidden from default lists. Documents stay attached."
        }
        confirmLabel={caseData.isArchived ? "Restore" : "Archive"}
        loading={archiveBusy}
      />
      <ConfirmModal
        isOpen={confirmDelete}
        onClose={() => !deleteBusy && setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete case permanently?"
        message="This permanently deletes the case and attached documents. This cannot be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleteBusy}
      />
    </PageShell>
  );
}
