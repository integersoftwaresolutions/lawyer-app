import { useEffect, useState } from "react";
import { Modal, Button, Input, Select, Textarea } from "../ui";
import { casesApi } from "../../services/cases.api";
import { getErrorMessage } from "../../utils/errorHandler";
import { useWorkspace } from "../../hooks/useWorkspaceAccess";

const TYPES = ["CIVIL", "CRIMINAL", "FAMILY", "CORPORATE", "TAX", "LABOR", "OTHER"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const STATUSES = ["INTAKE", "ACTIVE", "ON_HOLD", "CLOSED", "ARCHIVED"];
const VISIBILITIES = ["PRIVATE", "FIRM", "RESTRICTED"];

export default function CaseCreateModal({ isOpen, onClose, onCreated }) {
  const { isFirm } = useWorkspace();
  const [name, setName] = useState("");
  const [type, setType] = useState("CIVIL");
  const [typeCustom, setTypeCustom] = useState("");
  const [status, setStatus] = useState("INTAKE");
  const [priority, setPriority] = useState("MEDIUM");
  const [summary, setSummary] = useState("");
  const [visibility, setVisibility] = useState("PRIVATE");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setName("");
    setType("CIVIL");
    setTypeCustom("");
    setStatus("INTAKE");
    setPriority("MEDIUM");
    setSummary("");
    setVisibility(isFirm ? "FIRM" : "PRIVATE");
    setError("");
    setBusy(false);
  }, [isOpen, isFirm]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      setError("Enter a case name (at least 2 characters).");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await casesApi.create({
        name: name.trim(),
        type,
        typeCustom: type === "OTHER" ? typeCustom.trim() : undefined,
        status,
        priority,
        summary: summary.trim() || undefined,
        visibility
      });
      onCreated?.(res.data || res);
      onClose?.();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create case" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <p className="text-sm text-danger m-0 rounded-md bg-danger-light px-3 py-2">{error}</p>
        ) : null}
        <Input label="Case name" value={name} onChange={(e) => setName(e.target.value)} required />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            options={TYPES.map((t) => ({ value: t, label: t.replace(/_/g, " ") }))}
            placeholder="Select type"
          />
          <Select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            options={PRIORITIES.map((p) => ({ value: p, label: p }))}
            placeholder="Select priority"
          />
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, " ") }))}
            placeholder="Select status"
          />
          <Select
            label="Visibility"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            options={VISIBILITIES.map((v) => ({ value: v, label: v }))}
            placeholder="Select visibility"
          />
        </div>
        {type === "OTHER" ? (
          <Input
            label="Custom type"
            value={typeCustom}
            onChange={(e) => setTypeCustom(e.target.value)}
          />
        ) : null}
        <Textarea
          label="Summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={3}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={busy}>
            Create case
          </Button>
        </div>
      </form>
    </Modal>
  );
}
