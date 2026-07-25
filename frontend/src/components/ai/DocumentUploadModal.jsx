import { useEffect, useState } from "react";
import { FiFile, FiUploadCloud } from "react-icons/fi";
import { Modal, Button, Input, Textarea } from "../ui";

const TAB_FILE = "file";
const TAB_TEXT = "text";

const ACCEPTED = ".pdf,.txt,.html,.htm,.md";

export default function DocumentUploadModal({ isOpen, onClose, onSubmit, busy = false }) {
  const [tab, setTab] = useState(TAB_FILE);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [caseRef, setCaseRef] = useState("");
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [visibility, setVisibility] = useState("PRIVATE");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setTab(TAB_FILE);
      setTitle("");
      setDescription("");
      setCaseRef("");
      setFile(null);
      setText("");
      setVisibility("PRIVATE");
      setError("");
    }
  }, [isOpen]);

  function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) {
      setFile(null);
      return;
    }
    setFile(f);
    if (!title) {
      const base = f.name.replace(/\.[^.]+$/, "");
      setTitle(base.slice(0, 200));
    }
  }

  function handleSubmit() {
    setError("");
    if (!title.trim() || title.trim().length < 2) {
      setError("Please enter a title (at least 2 characters).");
      return;
    }
    if (tab === TAB_FILE && !file) {
      setError("Please choose a file to upload.");
      return;
    }
    if (tab === TAB_TEXT && (!text || text.trim().length < 20)) {
      setError("Please paste at least 20 characters of text.");
      return;
    }

    if (tab === TAB_FILE) {
      const fd = new FormData();
      fd.append("title", title.trim());
      if (description.trim()) fd.append("description", description.trim());
      if (caseRef.trim()) fd.append("caseRef", caseRef.trim());
      fd.append("visibility", visibility);
      fd.append("file", file);
      onSubmit({ kind: "file", payload: fd });
    } else {
      onSubmit({
        kind: "text",
        payload: {
          title: title.trim(),
          description: description.trim() || undefined,
          caseRef: caseRef.trim() || undefined,
          visibility,
          text: text.trim()
        }
      });
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={busy ? () => {} : onClose}
      title="Upload a private document"
      size="lg"
      closeOnOverlay={!busy}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={busy}>
            Upload & index
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          Documents are private to your account. The AI assistant will use them as context only when
          you ask questions, and they are isolated from other lawyers.
        </p>

        <div className="inline-flex rounded-lg border border-card-border overflow-hidden">
          <button
            type="button"
            onClick={() => setTab(TAB_FILE)}
            className={`px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === TAB_FILE ? "bg-primary text-primary-text" : "text-text-secondary hover:bg-surface-hover"
            }`}
          >
            Upload file
          </button>
          <button
            type="button"
            onClick={() => setTab(TAB_TEXT)}
            className={`px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === TAB_TEXT ? "bg-primary text-primary-text" : "text-text-secondary hover:bg-surface-hover"
            }`}
          >
            Paste text
          </button>
        </div>

        <Field label="Title" required>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Smith v. Khan – appellate brief"
          />
        </Field>

        <Field label="Description">
          <Textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional context that will help you find this later."
          />
        </Field>

        <Field label="Case reference">
          <Input
            value={caseRef}
            onChange={(e) => setCaseRef(e.target.value)}
            placeholder="Optional case number / matter ID."
          />
        </Field>

        <Field label="Visibility">
          <select
            className="w-full h-10 px-2 rounded-md border border-input-border bg-input-background text-sm"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
          >
            <option value="PRIVATE">Private (only you + owner)</option>
            <option value="FIRM">Firm (workspace members)</option>
            <option value="PUBLIC">Public (platform RAG corpus)</option>
          </select>
        </Field>

        {tab === TAB_FILE ? (
          <Field label="File">
            <label
              htmlFor="lawyer-doc-upload"
              className="flex items-center gap-3 rounded-lg border-2 border-dashed border-card-border bg-surface p-4 cursor-pointer hover:border-primary-border transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-primary-light text-primary flex items-center justify-center">
                {file ? <FiFile className="w-5 h-5" /> : <FiUploadCloud className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {file?.name || "Choose a file"}
                </p>
                <p className="text-xs text-text-muted">
                  PDF · TXT · HTML · Markdown — up to 25 MB
                </p>
              </div>
            </label>
            <input
              id="lawyer-doc-upload"
              type="file"
              accept={ACCEPTED}
              onChange={handleFile}
              className="hidden"
            />
          </Field>
        ) : (
          <Field label="Text" hint="Paste the contents of the document directly.">
            <Textarea
              rows={8}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste the document text here…"
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
