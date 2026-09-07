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
  practiceAreas: ""
};

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
  const currentPlanKey = entitlements?.planKey || "free";

  const handleUpgradePro = useCallback(async () => {
    if (!canManage) {
      toast.error("You need billing permission to change the plan");
      return;
    }
    if (isFirm) {
      toast.error("Pro is for personal workspaces. Switch to your personal workspace first.");
      return;
    }
    try {
      setBusyPlanKey(PLAN_KEYS.PRO);
      const res = await billingApi.checkout(workspaceId, { planKey: PLAN_KEYS.PRO });
      const url = res.data?.checkoutUrl;
      if (url) window.location.href = url;
      else toast.error("Checkout unavailable — Stripe may not be configured yet.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyPlanKey(null);
    }
  }, [canManage, isFirm, toast, workspaceId]);

  useEffect(() => {
    if (!handleUpgradeDeepLinks || loading || upgradeHandled || !entitlements) return;
    const upgrade = searchParams.get("upgrade");
    if (!upgrade) return;

    const next = new URLSearchParams(searchParams);
    next.delete("upgrade");
    setSearchParams(next, { replace: true });
    setUpgradeHandled(true);

    if (upgrade === "pro") {
      if (currentPlanKey === "pro" && sub?.status === "ACTIVE") {
        toast.success("You're already on Pro");
        return;
      }
      handleUpgradePro();
      return;
    }
    if (upgrade === "firm") {
      if (isFirm) {
        navigate("/lawyer/workspace/overview");
        return;
      }
      setFirmOpen(true);
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
    handleUpgradePro,
    navigate,
    toast
  ]);

  const handleCreateFirm = async (e) => {
    e.preventDefault();
    if (!firmForm.name.trim()) {
      toast.error("Firm name is required");
      return;
    }
    setFirmBusy(true);
    try {
      const data = await dispatch(
        createFirm({
          name: firmForm.name.trim(),
          city: firmForm.city,
          phone: firmForm.phone,
          website: firmForm.website,
          address: firmForm.address,
          description: firmForm.description,
          practiceAreas: firmForm.practiceAreas
            ? firmForm.practiceAreas.split(",").map((s) => s.trim()).filter(Boolean)
            : []
        })
      ).unwrap();

      if (data?.requiresCheckout && data?.checkoutUrl) {
        toast.success("Redirecting to Firm checkout…");
        window.location.href = data.checkoutUrl;
        return;
      }
      setFirmOpen(false);
      setFirmForm(emptyFirmForm);
      toast.success("Firm workspace created");
      navigate("/lawyer/workspace/overview");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setFirmBusy(false);
    }
  };

  const handleSelectPlan = async (plan) => {
    if (plan.key === PLAN_KEYS.FREE) {
      navigate("/lawyer/billing/usage");
      return;
    }
    if (plan.key === PLAN_KEYS.PRO) {
      if (currentPlanKey === "pro" && sub?.status === "ACTIVE") return;
      await handleUpgradePro();
      return;
    }
    if (plan.key === PLAN_KEYS.FIRM) {
      if (isFirm) {
        navigate("/lawyer/workspace/overview");
        return;
      }
      setFirmOpen(true);
    }
  };

  const handlePortal = async () => {
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

  const planLabels = useMemo(
    () => ({
      [PLAN_KEYS.FREE]: "View usage",
      [PLAN_KEYS.PRO]:
        currentPlanKey === "pro" && sub?.status === "ACTIVE"
          ? "Current plan"
          : sub?.status === "TRIALING"
            ? "Subscribe to Pro"
            : "Upgrade to Pro",
      [PLAN_KEYS.FIRM]: isFirm ? "Open firm settings" : "Create firm"
    }),
    [currentPlanKey, sub?.status, isFirm]
  );

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
    handleUpgradePro,
    handleSelectPlan,
    handlePortal,
    handleCreateFirm
  };
}
