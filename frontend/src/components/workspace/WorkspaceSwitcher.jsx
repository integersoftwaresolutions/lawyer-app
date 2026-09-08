import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FiBriefcase, FiCheck, FiChevronDown, FiPlus, FiUser } from "react-icons/fi";
import {
  activateWorkspace,
  createFirm,
  fetchWorkspaces
} from "../../store/slices/workspaceSlice";
import { useToast } from "../../hooks/useToast";
import { getErrorMessage } from "../../utils/errorHandler";
import FirmCreateModal from "../billing/FirmCreateModal";
import { billingApi } from "../../services/billing.api";
import { getDefaultPlans, mergeCatalogPlans, PLAN_KEYS } from "../../billing/plans";
import { BILLING_COMING_SOON } from "../../config/features";

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
  const [stripeConfigured, setStripeConfigured] = useState(true);
  const [plans, setPlans] = useState(getDefaultPlans());
  const [form, setForm] = useState({
    name: "",
    city: "",
    phone: "",
    website: "",
    address: "",
    description: "",
    practiceAreas: "",
    planKey: PLAN_KEYS.FIRM
  });

  const isNavbar = variant === "navbar";

  useEffect(() => {
    if (user?.role === "LAWYER") {
      dispatch(fetchWorkspaces());
      if (BILLING_COMING_SOON) return;
      billingApi
        .catalog()
        .then((res) => {
          const catalog = res.data;
          if (catalog?.plans) setPlans(mergeCatalogPlans(catalog.plans));
          if (catalog && typeof catalog.stripeConfigured === "boolean") {
            setStripeConfigured(catalog.stripeConfigured);
          }
        })
        .catch(() => {});
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
    if (!form.name.trim()) {
      toast.error("Firm name is required");
      return;
    }
    const planKey =
      form.planKey === PLAN_KEYS.FIRM_MAX ? PLAN_KEYS.FIRM_MAX : PLAN_KEYS.FIRM;
    const planName = planKey === PLAN_KEYS.FIRM_MAX ? "Law Firm Max" : "Law Firm Plan";
    setBusy(true);
    try {
      const data = await dispatch(
        createFirm({
          name: form.name.trim(),
          city: form.city,
          phone: form.phone,
          website: form.website,
          address: form.address,
          description: form.description,
          planKey,
          practiceAreas: form.practiceAreas
            ? form.practiceAreas.split(",").map((s) => s.trim()).filter(Boolean)
            : []
        })
      ).unwrap();

      if (data?.requiresCheckout && data?.checkoutUrl) {
        toast.success(`Redirecting to ${planName} checkout…`);
        window.location.href = data.checkoutUrl;
        return;
      }

      setCreateOpen(false);
      setForm({
        name: "",
        city: "",
        phone: "",
        website: "",
        address: "",
        description: "",
        practiceAreas: "",
        planKey: PLAN_KEYS.FIRM
      });
      toast.success(`Firm created on ${planName}`);
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

          {!BILLING_COMING_SOON ? (
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
          ) : null}
        </div>
      )}

      {!BILLING_COMING_SOON ? (
      <FirmCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        firmForm={form}
        setFirmForm={setForm}
        firmBusy={busy}
        onSubmit={handleCreate}
        stripeConfigured={stripeConfigured}
        plans={plans}
      />
      ) : null}
    </div>
  );
}
