import { useEffect, useState } from "react";
import { FiFile, FiUploadCloud } from "react-icons/fi";
import { Modal, Button, Input, Textarea } from "../ui";

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

const CURRENT_YEAR = new Date().getFullYear();
const ACCEPTED = ".pdf,.txt,.html,.htm,.md";

const initial = {
  title: "",
  court: "Supreme Court of Pakistan",
  year: String(CURRENT_YEAR),
  caseReference: "",
  citation: "",
  subject: "",
  judges: "",
  decisionDate: "",
  sourceUrl: "",
  sourceProvider: ""
};

export default function CaseLawUploadModal({ isOpen, onClose, onSubmit, busy = false }) {
  const [tab, setTab] = useState("file");
  const [form, setForm] = useState(initial);
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setTab("file");
      setForm(initial);
      setFile(null);
      setText("");
      setError("");
    }
  }, [isOpen]);

  function update(patch) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) {
      setFile(null);
      return;
    }
    setFile(f);
    if (!form.title) {
      const base = f.name.replace(/\.[^.]+$/, "");
      update({ title: base.slice(0, 200) });
    }
  }

  function buildBaseFields(target) {
    const append = (k, v) => {
      if (v === "" || v === null || v === undefined) return;
      if (target instanceof FormData) target.append(k, v);
      else target[k] = v;
    };
    append("title", form.title.trim());
    append("court", form.court);
    append("year", Number(form.year));
    append("caseReference", form.caseReference.trim());
    append("citation", form.citation.trim());
    append("subject", form.subject.trim());
    append("decisionDate", form.decisionDate);
    append("sourceUrl", form.sourceUrl.trim());
    append("sourceProvider", form.sourceProvider.trim());

    const judges = form.judges
      .split(",")
      .map((j) => j.trim())
      .filter(Boolean);
    if (judges.length > 0) {
      if (target instanceof FormData) {
        judges.forEach((j) => target.append("judges[]", j));
      } else {
        target.judges = judges;
      }
    }
  }

  function handleSubmit() {
    setError("");
    if (!form.title.trim() || form.title.trim().length < 2) {
      setError("Please enter a title.");
      return;
    }
    const yearNum = Number(form.year);
    if (!Number.isInteger(yearNum) || yearNum < 1900 || yearNum > 2100) {
      setError("Please enter a valid year between 1900 and 2100.");
      return;
    }
    if (tab === "file" && !file) {
      setError("Please choose a file to upload.");
      return;
    }
    if (tab === "text" && (!text || text.trim().length < 50)) {
      setError("Please paste at least 50 characters of text.");
      return;
    }

    if (tab === "file") {
      const fd = new FormData();
      buildBaseFields(fd);
      fd.append("file", file);
      onSubmit({ kind: "file", payload: fd });
    } else {
      const body = {};
      buildBaseFields(body);
      body.text = text.trim();
      onSubmit({ kind: "text", payload: body });
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={busy ? () => {} : onClose}
      title="Ingest case law"
      size="xl"
      closeOnOverlay={!busy}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={busy}>
            Ingest & index
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          Add a new judgment to the shared corpus. The text will be chunked, embedded, and indexed
          for retrieval by every lawyer's AI assistant.
        </p>

        <div className="inline-flex rounded-lg border border-card-border overflow-hidden">
          <button
            type="button"
            onClick={() => setTab("file")}
            className={`px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === "file" ? "bg-primary text-primary-text" : "text-text-secondary hover:bg-surface-hover"
            }`}
          >
            Upload file
          </button>
          <button
            type="button"
            onClick={() => setTab("text")}
            className={`px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === "text" ? "bg-primary text-primary-text" : "text-text-secondary hover:bg-surface-hover"
            }`}
          >
            Paste text
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Title" required>
            <Input
              value={form.title}
              onChange={(e) => update({ title: e.target.value })}
              placeholder="Muhammad Akram v. The State"
            />
          </Field>
          <Field label="Citation">
            <Input
              value={form.citation}
              onChange={(e) => update({ citation: e.target.value })}
              placeholder="PLD 2024 SC 123"
            />
          </Field>
          <Field label="Court" required>
            <select
              value={form.court}
              onChange={(e) => update({ court: e.target.value })}
              className="w-full h-10 px-3 rounded-md border border-input-border bg-input-background text-sm outline-none"
            >
              {COURTS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Year" required>
            <Input
              type="number"
              min={1900}
              max={2100}
              value={form.year}
              onChange={(e) => update({ year: e.target.value })}
            />
          </Field>
          <Field label="Case reference">
            <Input
              value={form.caseReference}
              onChange={(e) => update({ caseReference: e.target.value })}
              placeholder="Crl. Appeal 123/2023"
            />
          </Field>
          <Field label="Subject">
            <Input
              value={form.subject}
              onChange={(e) => update({ subject: e.target.value })}
              placeholder="Criminal Law"
            />
          </Field>
          <Field label="Judges (comma-separated)">
            <Input
              value={form.judges}
              onChange={(e) => update({ judges: e.target.value })}
              placeholder="Justice X, Justice Y"
            />
          </Field>
          <Field label="Decision date">
            <Input
              type="date"
              value={form.decisionDate}
              onChange={(e) => update({ decisionDate: e.target.value })}
            />
          </Field>
          <Field label="Source URL">
            <Input
              type="url"
              value={form.sourceUrl}
              onChange={(e) => update({ sourceUrl: e.target.value })}
              placeholder="https://supremecourt.gov.pk/..."
            />
          </Field>
          <Field label="Source provider">
            <Input
              value={form.sourceProvider}
              onChange={(e) => update({ sourceProvider: e.target.value })}
              placeholder="Supreme Court · PLD · etc."
            />
          </Field>
        </div>

        {tab === "file" ? (
          <Field label="File" required>
            <label
              htmlFor="case-law-upload"
              className="flex items-center gap-3 rounded-lg border-2 border-dashed border-card-border bg-surface p-4 cursor-pointer hover:border-primary-border transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-primary-light text-primary flex items-center justify-center">
                {file ? <FiFile className="w-5 h-5" /> : <FiUploadCloud className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {file?.name || "Choose a judgment file"}
                </p>
                <p className="text-xs text-text-muted">PDF · TXT · HTML · Markdown — up to 25 MB</p>
              </div>
            </label>
            <input
              id="case-law-upload"
              type="file"
              accept={ACCEPTED}
              onChange={handleFile}
              className="hidden"
            />
          </Field>
        ) : (
          <Field label="Judgment text" required>
            <Textarea
              rows={10}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste the full text of the judgment here…"
            />
          </Field>
        )}

        {error && (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-primary mb-1">
        {label}
        {required && <span className="text-danger ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}
