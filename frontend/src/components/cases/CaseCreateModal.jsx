import { useEffect, useState } from "react";
import { Modal, Button, Input, Select, Textarea } from "../ui";
import { casesApi } from "../../services/cases.api";
import { getErrorMessage } from "../../utils/errorHandler";
import { useWorkspace } from "../../hooks/useWorkspaceAccess";
import { useLawyerBookingOptions } from "../../hooks/useLawyerBookingOptions";

const TYPES = ["CIVIL", "CRIMINAL", "FAMILY", "CORPORATE", "TAX", "LABOR", "OTHER"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
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

function FieldGroup({ title, children }) {
  return (
    <div className="rounded-xl border border-card-border bg-surface p-3.5 space-y-3">
      <p className="text-[11px] uppercase tracking-wider font-semibold text-text-muted m-0">
        {title}
      </p>
      {children}
    </div>
  );
}

export default function CaseCreateModal({ isOpen, onClose, onCreated }) {
  const { isFirm } = useWorkspace();
  const { options: bookingOptions, loading: bookingsLoading } = useLawyerBookingOptions({
    enabled: isOpen,
    limit: 50
  });

  const [name, setName] = useState("");
  const [type, setType] = useState("CIVIL");
  const [typeCustom, setTypeCustom] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [clientName, setClientName] = useState("");
  const [clientContact, setClientContact] = useState("");
  const [opponentName, setOpponentName] = useState("");
  const [opponentCounsel, setOpponentCounsel] = useState("");
  const [counselName, setCounselName] = useState("");
  const [caseNumber, setCaseNumber] = useState("");
  const [court, setCourt] = useState("");
  const [nextHearingAt, setNextHearingAt] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [summary, setSummary] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setName("");
    setType("CIVIL");
    setTypeCustom("");
    setPriority("MEDIUM");
    setClientName("");
    setClientContact("");
    setOpponentName("");
    setOpponentCounsel("");
    setCounselName("");
    setCaseNumber("");
    setCourt("");
    setNextHearingAt("");
    setBookingId("");
    setSummary("");
    setError("");
    setBusy(false);
  }, [isOpen]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      setError("Enter a case name (at least 2 characters).");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const hasParties =
        clientName.trim() ||
        clientContact.trim() ||
        opponentName.trim() ||
        opponentCounsel.trim() ||
        counselName.trim();

      const parties = hasParties
        ? {
            client: {
              name: clientName.trim() || undefined,
              contact: clientContact.trim() || undefined
            },
            opponent: {
              name: opponentName.trim() || undefined,
              counsel: opponentCounsel.trim() || undefined
            },
            counsel: {
              name: counselName.trim() || undefined
            }
          }
        : undefined;

      const res = await casesApi.create({
        name: name.trim(),
        type,
        typeCustom: type === "OTHER" ? typeCustom.trim() : undefined,
        status: "INTAKE",
        priority,
        summary: summary.trim() || undefined,
        visibility: isFirm ? "FIRM" : "PRIVATE",
        caseNumber: caseNumber.trim() || undefined,
        court: court || undefined,
        nextHearingAt: nextHearingAt || undefined,
        parties,
        bookingId: bookingId || undefined
      });
      onCreated?.(res.data || res);
      onClose?.();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const fieldGap = "!mb-0";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create case"
      size="lg"
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="create-case-form" variant="primary" loading={busy}>
            Create case
          </Button>
        </>
      }
    >
      <form id="create-case-form" onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <p className="text-sm text-danger m-0 rounded-md bg-danger-light px-3 py-2">{error}</p>
        ) : null}

        <FieldGroup title="Matter">
          <Input
            label="Case name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            containerClassName={fieldGap}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              options={TYPES.map((t) => ({ value: t, label: t.replace(/_/g, " ") }))}
              placeholder="Select type"
              containerClassName={fieldGap}
            />
            <Select
              label="Priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              options={PRIORITIES.map((p) => ({ value: p, label: p }))}
              placeholder="Select priority"
              containerClassName={fieldGap}
            />
          </div>
          {type === "OTHER" ? (
            <Input
              label="Custom type"
              value={typeCustom}
              onChange={(e) => setTypeCustom(e.target.value)}
              containerClassName={fieldGap}
            />
          ) : null}
          <Textarea
            label="Summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={2}
            placeholder="Short matter overview"
            containerClassName={fieldGap}
          />
        </FieldGroup>

        <FieldGroup title="Parties">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Client name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Primary client"
              containerClassName={fieldGap}
            />
            <Input
              label="Contact number"
              value={clientContact}
              onChange={(e) => setClientContact(e.target.value)}
              placeholder="Phone or WhatsApp"
              containerClassName={fieldGap}
            />
            <Input
              label="Opponent"
              value={opponentName}
              onChange={(e) => setOpponentName(e.target.value)}
              placeholder="Opposing party"
              containerClassName={fieldGap}
            />
            <Input
              label="Opponent counsel"
              value={opponentCounsel}
              onChange={(e) => setOpponentCounsel(e.target.value)}
              placeholder="Opposing counsel"
              containerClassName={fieldGap}
            />
          </div>
          <Input
            label="Your counsel / co-counsel"
            value={counselName}
            onChange={(e) => setCounselName(e.target.value)}
            placeholder="Optional"
            containerClassName={fieldGap}
          />
        </FieldGroup>

        <FieldGroup title="Court & booking">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Case number"
              value={caseNumber}
              onChange={(e) => setCaseNumber(e.target.value)}
              placeholder="File / suit number"
              containerClassName={fieldGap}
            />
            <Select
              label="Court"
              value={court}
              onChange={(e) => setCourt(e.target.value)}
              options={COURTS.map((c) => ({ value: c, label: c }))}
              placeholder="Select court (optional)"
              containerClassName={fieldGap}
            />
            <Input
              label="Next hearing"
              type="date"
              value={nextHearingAt}
              onChange={(e) => setNextHearingAt(e.target.value)}
              containerClassName={fieldGap}
            />
            <Select
              label="Linked booking"
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              options={bookingOptions}
              placeholder={bookingsLoading ? "Loading bookings…" : "Select a booking (optional)"}
              disabled={bookingsLoading}
              containerClassName={fieldGap}
            />
          </div>
        </FieldGroup>
      </form>
    </Modal>
  );
}
