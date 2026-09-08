import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { billingApi } from "../services/billing.api";
import { useWorkspace, usePermission } from "./useWorkspaceAccess";
import { PERMISSIONS } from "../workspaces/permissions";
import { getDefaultPlans, mergeCatalogPlans, PLAN_KEYS } from "../billing/plans";
import { useToast } from "./useToast";
import { getErrorMessage } from "../utils/errorHandler";
import { createFirm } from "../store/slices/workspaceSlice";
import { BILLING_COMING_SOON } from "../config/features";

export const BILLING_METER_LABELS = Object.freeze({
  "cases.active": "Active cases",
  "ai.messages_per_month": "AI messages (this month)",
  "docs.count": "Documents",
  "docs.storage_mb": "Storage (MB)",
  seats: "Seats"
});

export function billingStatusVariant(status) {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "TRIALING":
      return "info";
    case "PAST_DUE":
      return "warning";
    default:
      return "secondary";
  }
}

const emptyFirmForm = {
  name: "",
  city: "",
  phone: "",
  website: "",
  address: "",
  description: "",
  practiceAreas: "",
  planKey: PLAN_KEYS.FIRM
};

const PERSONAL_KEYS = new Set([PLAN_KEYS.BASE, PLAN_KEYS.MAX]);
const FIRM_KEYS = new Set([PLAN_KEYS.FIRM, PLAN_KEYS.FIRM_MAX]);

/**
 * Shared billing state for Subscription / Usage / Invoices pages.
 */
export function useWorkspaceBilling({ handleUpgradeDeepLinks = false } = {}) {
  const toast = useToast();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { workspaceId, isFirm, isOwner, workspace } = useWorkspace();
  const canManage = usePermission(PERMISSIONS.BILLING_MANAGE) || isOwner;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [entitlements, setEntitlements] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [plans, setPlans] = useState(getDefaultPlans());
  const [stripeConfigured, setStripeConfigured] = useState(true);
  const [busyPlanKey, setBusyPlanKey] = useState(null);
  const [firmOpen, setFirmOpen] = useState(false);
  const [firmBusy, setFirmBusy] = useState(false);
  const [firmForm, setFirmForm] = useState(emptyFirmForm);
  const [upgradeHandled, setUpgradeHandled] = useState(false);

  const load = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const [entRes, subRes, catalogRes] = await Promise.all([
        billingApi.entitlements(workspaceId),
        billingApi.subscription(workspaceId),
        billingApi.catalog().catch(() => null)
      ]);
      setEntitlements(entRes.data);
      setInvoices(subRes.data?.invoices || []);
      const catalog = catalogRes?.data;
      if (catalog?.plans) {
        setPlans(mergeCatalogPlans(catalog.plans));
        setStripeConfigured(Boolean(catalog.stripeConfigured));
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const checkout = searchParams.get("checkout") || searchParams.get("firmCheckout");
    if (!checkout) return;
    if (checkout === "success") {
      toast.success("Payment received — your plan will update in a moment");
    }
    if (checkout === "cancel") toast.success("Checkout canceled");
    const next = new URLSearchParams(searchParams);
    next.delete("checkout");
    next.delete("firmCheckout");
    setSearchParams(next, { replace: true });
    load();
  }, [searchParams, setSearchParams, toast, load]);

  const sub = entitlements?.subscription;
  const meters = entitlements?.meters || {};
  const currentPlanKey = entitlements?.planKey || PLAN_KEYS.BASE;

  const handleCheckout = useCallback(
    async (planKey) => {
      if (BILLING_COMING_SOON) {
        toast.error("Paid plans are coming soon. You cannot checkout yet.");
        return;
      }
      if (!canManage) {
        toast.error("You need billing permission to change the plan");
        return;
      }
      if (PERSONAL_KEYS.has(planKey) && isFirm) {
        toast.error("Base and Max are for personal workspaces. Switch workspace first.");
        return;
      }
      if (FIRM_KEYS.has(planKey) && !isFirm) {
        toast.error("Firm plans require a firm workspace. Create a firm first.");
        return;
      }
      try {
        setBusyPlanKey(planKey);
        const res = await billingApi.checkout(workspaceId, { planKey });
        const url = res.data?.checkoutUrl;
        if (url) window.location.href = url;
        else toast.error("Checkout unavailable — Stripe may not be configured yet.");
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setBusyPlanKey(null);
      }
    },
    [canManage, isFirm, toast, workspaceId]
  );

  /** @deprecated use handleCheckout(PLAN_KEYS.MAX) */
  const handleUpgradePro = useCallback(() => handleCheckout(PLAN_KEYS.MAX), [handleCheckout]);

  useEffect(() => {
    if (BILLING_COMING_SOON) return;
    if (!handleUpgradeDeepLinks || loading || upgradeHandled || !entitlements) return;
    const upgrade = searchParams.get("upgrade");
    if (!upgrade) return;

    const next = new URLSearchParams(searchParams);
    next.delete("upgrade");
    setSearchParams(next, { replace: true });
    setUpgradeHandled(true);

    const key = upgrade === "pro" ? PLAN_KEYS.MAX : upgrade;

    if (key === PLAN_KEYS.FIRM) {
      if (isFirm) {
        handleCheckout(PLAN_KEYS.FIRM);
        return;
      }
      setFirmForm((f) => ({ ...f, planKey: PLAN_KEYS.FIRM }));
      setFirmOpen(true);
      return;
    }

    if (key === PLAN_KEYS.FIRM_MAX) {
      if (isFirm) {
        if (currentPlanKey === PLAN_KEYS.FIRM_MAX && sub?.status === "ACTIVE") {
          toast.success("You're already on Law Firm Max");
          return;
        }
        handleCheckout(PLAN_KEYS.FIRM_MAX);
        return;
      }
      setFirmForm((f) => ({ ...f, planKey: PLAN_KEYS.FIRM_MAX }));
      setFirmOpen(true);
      return;
    }

    if (PERSONAL_KEYS.has(key)) {
      if (currentPlanKey === key && sub?.status === "ACTIVE") {
        toast.success(`You're already on ${key === PLAN_KEYS.MAX ? "Adal Max" : "Adal Base"}`);
        return;
      }
      handleCheckout(key);
    }
  }, [
    handleUpgradeDeepLinks,
    loading,
    upgradeHandled,
    entitlements,
    searchParams,
    setSearchParams,
    currentPlanKey,
    sub?.status,
    isFirm,
    handleCheckout,
    toast,
    setFirmForm
  ]);

  const handleCreateFirm = async (e) => {
    e.preventDefault();
    if (BILLING_COMING_SOON) {
      toast.error("Paid plans are coming soon. You cannot checkout yet.");
      return;
    }
    if (!firmForm.name.trim()) {
      toast.error("Firm name is required");
      return;
    }
    if (!firmForm.planKey || (firmForm.planKey !== PLAN_KEYS.FIRM && firmForm.planKey !== PLAN_KEYS.FIRM_MAX)) {
      toast.error("Choose Law Firm Plan or Law Firm Max");
      return;
    }
    setFirmBusy(true);
    try {
      const planKey = firmForm.planKey;
      const planName = planKey === PLAN_KEYS.FIRM_MAX ? "Law Firm Max" : "Law Firm Plan";
      const data = await dispatch(
        createFirm({
          name: firmForm.name.trim(),
          city: firmForm.city,
          phone: firmForm.phone,
          website: firmForm.website,
          address: firmForm.address,
          description: firmForm.description,
          planKey,
          practiceAreas: firmForm.practiceAreas
            ? firmForm.practiceAreas.split(",").map((s) => s.trim()).filter(Boolean)
            : []
        })
      ).unwrap();

      if (data?.requiresCheckout && data?.checkoutUrl) {
        toast.success(`Redirecting to ${planName} checkout…`);
        window.location.href = data.checkoutUrl;
        return;
      }
      setFirmOpen(false);
      setFirmForm(emptyFirmForm);
      toast.success(`Firm workspace created on ${planName}`);
      navigate("/lawyer/workspace/overview");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setFirmBusy(false);
    }
  };

  const handleSelectPlan = async (plan) => {
    if (plan.key === PLAN_KEYS.BASE) {
      if (currentPlanKey === PLAN_KEYS.BASE && sub?.status === "ACTIVE") return;
      if (sub?.status === "TRIALING" || sub?.status === "FREE") {
        await handleCheckout(PLAN_KEYS.BASE);
        return;
      }
      navigate("/lawyer/billing/usage");
      return;
    }
    if (plan.key === PLAN_KEYS.MAX) {
      if (currentPlanKey === PLAN_KEYS.MAX && sub?.status === "ACTIVE") return;
      await handleCheckout(PLAN_KEYS.MAX);
      return;
    }
    if (plan.key === PLAN_KEYS.FIRM) {
      if (isFirm) {
        if (currentPlanKey === PLAN_KEYS.FIRM && sub?.status === "ACTIVE") return;
        await handleCheckout(PLAN_KEYS.FIRM);
        return;
      }
      setFirmForm((f) => ({ ...f, planKey: PLAN_KEYS.FIRM }));
      setFirmOpen(true);
      return;
    }
    if (plan.key === PLAN_KEYS.FIRM_MAX) {
      if (isFirm) {
        if (currentPlanKey === PLAN_KEYS.FIRM_MAX && sub?.status === "ACTIVE") return;
        await handleCheckout(PLAN_KEYS.FIRM_MAX);
        return;
      }
      setFirmForm((f) => ({ ...f, planKey: PLAN_KEYS.FIRM_MAX }));
      setFirmOpen(true);
    }
  };

  const handlePortal = async () => {
    if (BILLING_COMING_SOON) {
      toast.error("Paid plans are coming soon. You cannot checkout yet.");
      return;
    }
    try {
      setBusyPlanKey("portal");
      const res = await billingApi.portal(workspaceId);
      const url = res.data?.portalUrl;
      if (url) window.location.href = url;
      else toast.error("Billing portal unavailable");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyPlanKey(null);
    }
  };

  const planLabels = useMemo(() => {
    const active = (key) => currentPlanKey === key && sub?.status === "ACTIVE";
    return {
      [PLAN_KEYS.BASE]:
        active(PLAN_KEYS.BASE)
          ? "Current plan"
          : sub?.status === "TRIALING"
            ? "Subscribe to Base"
            : "Get Adal Base",
      [PLAN_KEYS.MAX]:
        active(PLAN_KEYS.MAX)
          ? "Current plan"
          : sub?.status === "TRIALING"
            ? "Upgrade to Max"
            : "Upgrade to Max",
      [PLAN_KEYS.FIRM]: isFirm
        ? active(PLAN_KEYS.FIRM)
          ? "Current plan"
          : "Switch to Firm"
        : "Create firm",
      [PLAN_KEYS.FIRM_MAX]: isFirm
        ? active(PLAN_KEYS.FIRM_MAX)
          ? "Current plan"
          : "Upgrade to Firm Max"
        : "Create firm on Max"
    };
  }, [currentPlanKey, sub?.status, isFirm]);

  return {
    workspace,
    workspaceId,
    isFirm,
    canManage,
    loading,
    error,
    load,
    entitlements,
    invoices,
    plans,
    stripeConfigured,
    busyPlanKey,
    sub,
    meters,
    currentPlanKey,
    planLabels,
    firmOpen,
    setFirmOpen,
    firmBusy,
    firmForm,
    setFirmForm,
    handleCheckout,
    handleUpgradePro,
    handleSelectPlan,
    handlePortal,
    handleCreateFirm
  };
}
