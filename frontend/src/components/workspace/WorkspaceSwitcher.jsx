import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FiBriefcase, FiCheck, FiChevronDown, FiPlus, FiUser } from "react-icons/fi";
import {
  activateWorkspace,
  createFirm,
  fetchWorkspaces
} from "../../store/slices/workspaceSlice";
import { Button, Modal, Input, Textarea } from "../ui";
import { useToast } from "../../hooks/useToast";
import { getErrorMessage } from "../../utils/errorHandler";

/** Minimal switcher: list workspaces + create firm. Admin lives under /lawyer/workspace. */
export default function WorkspaceSwitcher({ variant = "sidebar" }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const { items, activeWorkspaceId, loading } = useSelector((s) => s.workspace);
  const user = useSelector((s) => s.auth.user);
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    city: "",
    phone: "",
    website: "",
    address: "",
    description: "",
    practiceAreas: ""
  });

  const isNavbar = variant === "navbar";

  useEffect(() => {
    if (user?.role === "LAWYER") {
      dispatch(fetchWorkspaces());
    }
  }, [dispatch, user?.role]);

  useEffect(() => {
    if (!open) return undefined;
    function onDocClick(e) {
      if (!e.target.closest?.("[data-workspace-switcher]")) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  if (user?.role !== "LAWYER") return null;

  const active = items.find((w) => String(w.id) === String(activeWorkspaceId)) || items[0];

  async function handleSwitch(id) {
    if (String(id) === String(activeWorkspaceId)) {
      setOpen(false);
      return;
    }
    try {
      await dispatch(activateWorkspace(id)).unwrap();
      setOpen(false);
      toast.success("Workspace switched");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await dispatch(
        createFirm({
          name: form.name.trim(),
          city: form.city,
          phone: form.phone,
          website: form.website,
          address: form.address,
          description: form.description,
          practiceAreas: form.practiceAreas
            ? form.practiceAreas.split(",").map((s) => s.trim()).filter(Boolean)
            : []
        })
      ).unwrap();
      setCreateOpen(false);
      setForm({
        name: "",
        city: "",
        phone: "",
        website: "",
        address: "",
        description: "",
        practiceAreas: ""
      });
      toast.success("Firm created");
      navigate("/lawyer/workspace/overview");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      data-workspace-switcher
      className={`relative ${isNavbar ? "min-w-0 max-w-[200px] sm:max-w-[240px]" : "mb-3 w-full"}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 rounded-lg border border-card-border bg-surface hover:bg-surface-hover transition-colors text-left ${
          isNavbar ? "h-9 px-2 sm:px-2.5 w-full min-w-0" : "w-full px-2.5 py-2"
        }`}
        aria-label="Switch workspace"
      >
        <span
          className={`rounded-lg bg-primary-light text-primary flex items-center justify-center shrink-0 ${
            isNavbar ? "w-7 h-7" : "w-8 h-8"
          }`}
        >
          {active?.type === "FIRM" ? (
            <FiBriefcase className={isNavbar ? "w-3.5 h-3.5" : "w-4 h-4"} />
          ) : (
            <FiUser className={isNavbar ? "w-3.5 h-3.5" : "w-4 h-4"} />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={`block font-semibold text-text-primary truncate ${
              isNavbar ? "text-sm leading-tight" : "text-sm"
            }`}
          >
            {loading && !active ? "Loading…" : active?.name || "Select workspace"}
          </span>
        </span>
        <FiChevronDown
          className={`w-4 h-4 text-text-muted shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className={`absolute top-full mt-1 z-[200] rounded-xl border border-card-border bg-card shadow-lg overflow-hidden ${
            isNavbar ? "left-0 w-[min(100vw-2rem,280px)]" : "left-0 right-0"
          }`}
        >
          <ul className="max-h-56 overflow-y-auto m-0 p-1 list-none">
            {items.map((w) => (
              <li key={w.id}>
                <button
                  type="button"
                  onClick={() => handleSwitch(w.id)}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left hover:bg-surface-hover"
                >
                  <span className="w-7 h-7 rounded-md bg-primary-light text-primary flex items-center justify-center shrink-0">
                    {w.type === "FIRM" ? (
                      <FiBriefcase className="w-3.5 h-3.5" />
                    ) : (
                      <FiUser className="w-3.5 h-3.5" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-text-primary truncate">
                      {w.name}
                    </span>
                    <span className="block text-[11px] text-text-muted">
                      {w.type === "PERSONAL" ? "Personal" : "Firm"}
                    </span>
                  </span>
                  {String(w.id) === String(activeWorkspaceId) && (
                    <FiCheck className="w-4 h-4 text-primary shrink-0" />
                  )}
                </button>
              </li>
            ))}
          </ul>

          <div className="border-t border-card-border p-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setCreateOpen(true);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-medium text-primary hover:bg-primary-light"
            >
              <FiPlus className="w-4 h-4" />
              Create firm
            </button>
          </div>
        </div>
      )}

      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create firm"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} loading={busy}>
              Create firm
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-3">
          <Input
            label="Firm name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="City"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
            <Input
              label="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <Input
            label="Website"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
          />
          <Input
            label="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <Input
            label="Practice areas"
            placeholder="Family Law, Criminal Law"
            value={form.practiceAreas}
            onChange={(e) => setForm({ ...form, practiceAreas: e.target.value })}
          />
          <Textarea
            label="Description"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </form>
      </Modal>
    </div>
  );
}
