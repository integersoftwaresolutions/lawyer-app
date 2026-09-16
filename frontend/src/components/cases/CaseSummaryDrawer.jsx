import { useEffect, useMemo, useState } from "react";
import {
  FiEdit2,
  FiCalendar,
  FiMapPin,
  FiUser,
  FiPhone,
  FiLink,
  FiClock,
  FiHash
} from "react-icons/fi";
import { Badge, Button, Drawer, Spinner } from "../ui";
import { casesApi } from "../../services/cases.api";
import { getErrorMessage } from "../../utils/errorHandler";
import { usePermission } from "../../hooks/useWorkspaceAccess";
import { PERMISSIONS } from "../../workspaces/permissions";

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

function formatDate(value) {
  if (!value) return null;
  try {
    return new Date(value).toLocaleDateString(undefined, { dateStyle: "medium" });
  } catch {
    return null;
  }
}

function formatWhen(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short"
    });
  } catch {
    return "";
  }
}

function daysUntil(value) {
  if (!value) return null;
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

function initials(name) {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || "").join("") || "?";
}

function Section({ title, action, children }) {
  return (
    <section>
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted m-0">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function MetaItem({ icon: Icon, label, value }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5 shrink-0 text-text-muted" />
        <span className="text-[11px] text-text-muted truncate">{label}</span>
      </div>
      <p className="text-sm text-text-primary m-0 leading-snug break-words">{value || "—"}</p>
    </div>
  );
}

function PartyRow({ role, name, detail, detailIcon: DetailIcon }) {
  const hasName = Boolean(name?.trim());
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
      <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-[11px] font-semibold text-text-secondary shrink-0">
        {hasName ? initials(name) : <FiUser className="w-3.5 h-3.5 text-text-muted" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-text-muted m-0 mb-0.5">{role}</p>
        <p className="text-sm text-text-primary m-0 truncate">{hasName ? name : "—"}</p>
        {detail ? (
          <p className="text-xs text-text-secondary m-0 mt-0.5 flex items-center gap-1.5 min-w-0">
            {DetailIcon ? <DetailIcon className="w-3 h-3 shrink-0 text-text-muted" /> : null}
            <span className="truncate">{detail}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Right-side case summary drawer — simple overview + notes.
 */
export default function CaseSummaryDrawer({ isOpen, onClose, caseId, onEdit }) {
  const canEdit = usePermission(PERMISSIONS.CASES_EDIT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [caseData, setCaseData] = useState(null);
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    if (!isOpen || !caseId) {
      setCaseData(null);
      setNotes([]);
      setError("");
      return undefined;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await casesApi.get(caseId);
        const data = res.data || res;
        if (cancelled) return;
        setCaseData(data);
        setNotes([...(data.notes || [])].reverse());
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err));
          setCaseData(null);
          setNotes([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, caseId]);

  const hearingDelta = useMemo(
    () => daysUntil(caseData?.nextHearingAt),
    [caseData?.nextHearingAt]
  );

  const hearingLabel = useMemo(() => {
    const date = formatDate(caseData?.nextHearingAt);
    if (!date) return null;
    if (hearingDelta === null) return date;
    if (hearingDelta === 0) return `${date} · Today`;
    if (hearingDelta === 1) return `${date} · Tomorrow`;
    if (hearingDelta > 1) return `${date} · in ${hearingDelta} days`;
    return `${date} · ${Math.abs(hearingDelta)}d ago`;
  }, [caseData?.nextHearingAt, hearingDelta]);

  const typeLabel = caseData?.type?.replace(/_/g, " ") || "Matter";

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      width="max-w-lg"
      header={
        <div className="min-w-0 pr-2">
          <h2 className="text-base font-semibold text-text-primary m-0 truncate">
            {caseData?.name || (loading ? "Loading…" : "Case summary")}
          </h2>
          {caseData ? (
            <p className="text-xs text-text-muted m-0 mt-0.5 truncate">
              {[typeLabel, caseData.caseNumber].filter(Boolean).join(" · ")}
            </p>
          ) : null}
        </div>
      }
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
          {caseId ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={FiEdit2}
              onClick={() => onEdit?.(caseId)}
            >
              {canEdit ? "Edit case" : "Open case"}
            </Button>
          ) : null}
        </div>
      }
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Spinner className="w-5 h-5" />
          <p className="text-sm text-text-muted m-0">Loading…</p>
        </div>
      ) : null}

      {!loading && error ? (
        <div className="rounded-md bg-danger-light border border-danger px-3 py-2 text-sm text-danger">
          {error}
        </div>
      ) : null}

      {!loading && !error && caseData ? (
        <div className="space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              <Badge variant={STATUS_VARIANT[caseData.status] || "default"} size="sm">
                {(caseData.status || "").replace(/_/g, " ") || "—"}
              </Badge>
              <Badge variant={PRIORITY_VARIANT[caseData.priority] || "default"} size="sm">
                {caseData.priority || "—"}
              </Badge>
              <Badge variant="secondary" size="sm">
                {(caseData.visibility || "PRIVATE").toLowerCase()}
              </Badge>
            </div>
            {caseData.summary ? (
              <p className="text-sm text-text-secondary m-0 leading-relaxed">{caseData.summary}</p>
            ) : (
              <p className="text-sm text-text-muted m-0">No summary yet.</p>
            )}
          </div>

          <Section title="Details">
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              <MetaItem icon={FiCalendar} label="Next hearing" value={hearingLabel} />
              <MetaItem icon={FiClock} label="Opened" value={formatDate(caseData.openedAt)} />
              <MetaItem icon={FiHash} label="Case number" value={caseData.caseNumber} />
              <MetaItem
                icon={FiMapPin}
                label="Court"
                value={[caseData.court, caseData.jurisdictionCity].filter(Boolean).join(" · ")}
              />
            </div>
          </Section>

          <Section title="Parties">
            <div className="border-t border-border">
              <PartyRow
                role="Client"
                name={caseData.parties?.client?.name}
                detail={caseData.parties?.client?.contact}
                detailIcon={FiPhone}
              />
              <PartyRow
                role="Opponent"
                name={caseData.parties?.opponent?.name}
                detail={
                  caseData.parties?.opponent?.counsel
                    ? `Counsel: ${caseData.parties.opponent.counsel}`
                    : null
                }
              />
              <PartyRow role="Counsel" name={caseData.parties?.counsel?.name} />
            </div>
          </Section>

          <Section title="Booking">
            {caseData.bookingId ? (
              <p className="text-sm text-text-primary m-0 flex items-start gap-2">
                <FiLink className="w-3.5 h-3.5 mt-0.5 shrink-0 text-text-muted" />
                <span className="font-mono text-xs break-all">{String(caseData.bookingId)}</span>
              </p>
            ) : (
              <p className="text-sm text-text-muted m-0">No booking linked.</p>
            )}
          </Section>

          <Section
            title="Notes"
            action={
              <span className="text-[11px] text-text-muted tabular-nums">{notes.length}</span>
            }
          >
            {notes.length === 0 ? (
              <p className="text-sm text-text-muted m-0">No notes yet.</p>
            ) : (
              <ul className="m-0 p-0 list-none space-y-3">
                {notes.slice(0, 6).map((note) => (
                  <li key={note.id || note._id}>
                    <p className="text-sm text-text-primary m-0 whitespace-pre-wrap leading-relaxed">
                      {note.body}
                    </p>
                    <p className="text-[11px] text-text-muted m-0 mt-1">
                      {formatWhen(note.createdAt || note.updatedAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            {notes.length > 6 ? (
              <p className="text-xs text-text-muted m-0 mt-2">
                Showing latest 6. Open Edit for the full timeline.
              </p>
            ) : null}
          </Section>
        </div>
      ) : null}
    </Drawer>
  );
}
