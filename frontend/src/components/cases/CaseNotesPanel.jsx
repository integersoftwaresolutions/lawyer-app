import { useState } from "react";
import { FiEdit2, FiPlus, FiTrash2, FiX, FiCheck } from "react-icons/fi";
import { Button, Textarea, ConfirmModal } from "../ui";
import { casesApi } from "../../services/cases.api";
import { getErrorMessage } from "../../utils/errorHandler";

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

/**
 * Case notes timeline — local state updates, loaders, inline edit/delete.
 */
export default function CaseNotesPanel({
  caseId,
  notes = [],
  canEdit = false,
  onNotesChange,
  toast
}) {
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editBody, setEditBody] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  function canModifyNote() {
    return canEdit;
  }

  async function handleAdd(e) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || adding) return;
    setAdding(true);
    try {
      const res = await casesApi.addNote(caseId, body);
      const note = res.data || res;
      onNotesChange([note, ...notes]);
      setDraft("");
      toast?.success("Note added");
    } catch (err) {
      toast?.error(getErrorMessage(err));
    } finally {
      setAdding(false);
    }
  }

  function startEdit(note) {
    setEditingId(note.id);
    setEditBody(note.body || "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditBody("");
  }

  async function saveEdit() {
    if (!editingId || !editBody.trim()) return;
    setSavingId(editingId);
    try {
      const res = await casesApi.updateNote(caseId, editingId, editBody.trim());
      const updated = res.data || res;
      onNotesChange(notes.map((n) => (n.id === editingId ? { ...n, ...updated } : n)));
      cancelEdit();
      toast?.success("Note updated");
    } catch (err) {
      toast?.error(getErrorMessage(err));
    } finally {
      setSavingId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await casesApi.deleteNote(caseId, deleteTarget.id);
      onNotesChange(notes.filter((n) => n.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast?.success("Note deleted");
    } catch (err) {
      toast?.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <form onSubmit={handleAdd} className="rounded-lg border border-card-border bg-surface p-3 sm:p-4">
          <Textarea
            label="New note"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            placeholder="Add a timeline note…"
            disabled={adding}
            containerClassName="mb-3"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              icon={FiPlus}
              loading={adding}
              disabled={!draft.trim() || adding}
            >
              Add note
            </Button>
          </div>
        </form>
      )}

      {!notes.length ? (
        <p className="text-sm text-text-muted m-0 py-2">No notes yet.</p>
      ) : (
        <ul className="m-0 p-0 list-none space-y-3">
          {notes.map((note) => {
            const editable = canModifyNote();
            const isEditing = editingId === note.id;
            return (
              <li
                key={note.id}
                className="rounded-lg border border-card-border bg-surface p-3 sm:p-4"
              >
                {isEditing ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      rows={3}
                      disabled={savingId === note.id}
                      containerClassName="mb-0"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        icon={FiX}
                        onClick={cancelEdit}
                        disabled={savingId === note.id}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        icon={FiCheck}
                        loading={savingId === note.id}
                        disabled={!editBody.trim()}
                        onClick={saveEdit}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-text-primary m-0 whitespace-pre-wrap flex-1 min-w-0">
                        {note.body}
                      </p>
                      {editable && (
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            className="p-1.5 rounded-md text-text-muted hover:text-primary hover:bg-primary-light transition-colors"
                            aria-label="Edit note"
                            onClick={() => startEdit(note)}
                          >
                            <FiEdit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            className="p-1.5 rounded-md text-text-muted hover:text-danger hover:bg-danger-light transition-colors"
                            aria-label="Delete note"
                            onClick={() => setDeleteTarget(note)}
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-text-muted m-0 mt-2">
                      {formatWhen(note.updatedAt || note.createdAt)}
                      {note.updatedAt &&
                      note.createdAt &&
                      String(note.updatedAt) !== String(note.createdAt)
                        ? " · edited"
                        : ""}
                    </p>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete note?"
        message="This note will be removed from the case timeline."
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleting}
      />
    </div>
  );
}
