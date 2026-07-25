import { useEffect, useState } from "react";
import { Modal, Button, Input, Textarea } from "../ui";
import { FiPlus, FiTrash2 } from "react-icons/fi";

const EMPTY_BRIEF = {
  facts: "",
  theory: "",
  arguments: "",
  exhibits: "",
  weaknesses: "",
  witnesses: []
};

export default function CrossExamBriefModal({
  isOpen,
  onClose,
  onSubmit,
  initialBrief,
  submitLabel = "Save brief",
  busy = false
}) {
  const [form, setForm] = useState(EMPTY_BRIEF);

  useEffect(() => {
    if (!isOpen) return;
    setForm({
      ...EMPTY_BRIEF,
      ...(initialBrief || {}),
      witnesses: Array.isArray(initialBrief?.witnesses) ? [...initialBrief.witnesses] : []
    });
  }, [isOpen, initialBrief]);

  function update(patch) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  function addWitness() {
    setForm((prev) => ({
      ...prev,
      witnesses: [...(prev.witnesses || []), { name: "", role: "", statement: "" }]
    }));
  }

  function updateWitness(idx, patch) {
    setForm((prev) => ({
      ...prev,
      witnesses: prev.witnesses.map((w, i) => (i === idx ? { ...w, ...patch } : w))
    }));
  }

  function removeWitness(idx) {
    setForm((prev) => ({
      ...prev,
      witnesses: prev.witnesses.filter((_, i) => i !== idx)
    }));
  }

  function handleSubmit() {
    const cleaned = {
      facts: form.facts?.trim() || "",
      theory: form.theory?.trim() || "",
      arguments: form.arguments?.trim() || "",
      exhibits: form.exhibits?.trim() || "",
      weaknesses: form.weaknesses?.trim() || "",
      witnesses: (form.witnesses || [])
        .map((w) => ({
          name: (w.name || "").trim(),
          role: (w.role || "").trim(),
          statement: (w.statement || "").trim()
        }))
        .filter((w) => w.name || w.role || w.statement)
    };
    onSubmit(cleaned);
  }

  const factsValid = (form.facts || "").trim().length >= 20;

  return (
    <Modal
      isOpen={isOpen}
      onClose={busy ? () => {} : onClose}
      title="Case brief for cross-examination"
      size="xl"
      closeOnOverlay={!busy}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!factsValid} loading={busy}>
            {submitLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          Provide as much detail as possible. The opposing-counsel AI will use this brief — and only
          this brief — to shape its cross-examination questions.
        </p>

        <Field label="Case facts" required hint="Required, at least a short paragraph.">
          <Textarea
            rows={4}
            value={form.facts}
            onChange={(e) => update({ facts: e.target.value })}
            placeholder="Chronology of events, parties involved, key dates..."
          />
        </Field>

        <Field label="Case theory">
          <Textarea
            rows={3}
            value={form.theory}
            onChange={(e) => update({ theory: e.target.value })}
            placeholder="Your one-paragraph theory of the case."
          />
        </Field>

        <Field label="Key arguments">
          <Textarea
            rows={3}
            value={form.arguments}
            onChange={(e) => update({ arguments: e.target.value })}
            placeholder="Main legal arguments, references to PPC / CrPC / Constitution..."
          />
        </Field>

        <Field label="Exhibits / evidence">
          <Textarea
            rows={2}
            value={form.exhibits}
            onChange={(e) => update({ exhibits: e.target.value })}
            placeholder="Documents, photographs, recordings, expert reports..."
          />
        </Field>

        <Field label="Witnesses" hint="Add the witnesses you may need to defend or attack.">
          <div className="space-y-3">
            {(form.witnesses || []).map((w, idx) => (
              <div key={idx} className="rounded-lg border border-card-border bg-surface p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-text-muted">Witness #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeWitness(idx)}
                    className="ml-auto text-xs text-danger hover:underline inline-flex items-center gap-1"
                  >
                    <FiTrash2 className="w-3 h-3" /> Remove
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input
                    placeholder="Name"
                    value={w.name || ""}
                    onChange={(e) => updateWitness(idx, { name: e.target.value })}
                  />
                  <Input
                    placeholder="Role (e.g. complainant, eyewitness)"
                    value={w.role || ""}
                    onChange={(e) => updateWitness(idx, { role: e.target.value })}
                  />
                </div>
                <Textarea
                  rows={2}
                  placeholder="Recorded statement / what they will testify to..."
                  value={w.statement || ""}
                  onChange={(e) => updateWitness(idx, { statement: e.target.value })}
                />
              </div>
            ))}
            <Button variant="secondary" icon={FiPlus} size="sm" onClick={addWitness}>
              Add witness
            </Button>
          </div>
        </Field>

        <Field label="Acknowledged weaknesses" hint="Be honest — the AI is more useful if it knows the soft spots.">
          <Textarea
            rows={2}
            value={form.weaknesses}
            onChange={(e) => update({ weaknesses: e.target.value })}
            placeholder="Gaps in the chain of custody, timing inconsistencies, hostile witnesses..."
          />
        </Field>
      </div>
    </Modal>
  );
}

function Field({ label, hint, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-primary mb-1">
        {label}
        {required && <span className="text-danger ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-text-muted">{hint}</p>}
    </div>
  );
}
