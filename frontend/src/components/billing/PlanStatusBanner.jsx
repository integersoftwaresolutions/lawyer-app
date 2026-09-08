import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiCreditCard } from "react-icons/fi";
import { billingApi } from "../../services/billing.api";
import { useWorkspace } from "../../hooks/useWorkspaceAccess";
import { BILLING_COMING_SOON } from "../../config/features";
import Button from "../ui/Button";

/** Compact plan status + upgrade CTA for dashboard overview. */
export default function PlanStatusBanner() {
  const { workspaceId } = useWorkspace();
  const [ent, setEnt] = useState(null);

  useEffect(() => {
    if (!workspaceId) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const res = await billingApi.entitlements(workspaceId);
        if (!cancelled) setEnt(res.data);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  if (!ent) return null;

  const status = ent.subscription?.status || "FREE";
  const planName = ent.planName || ent.planKey || "Base";
  const trialEnds = ent.subscription?.trialEndsAt;
  const locked = Boolean(ent.practiceLocked);
  const showUpgrade =
    locked ||
    status === "TRIALING" ||
    status === "FREE" ||
    ent.planKey === "base" ||
    (ent.meters?.["ai.messages_per_month"]?.pct ?? 0) >= 80;

  if (BILLING_COMING_SOON) {
    return (
      <div className="rounded-xl border border-card-border bg-card px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-primary-light text-primary flex items-center justify-center shrink-0">
            <FiCreditCard className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary m-0">
              {planName} · {status}
            </p>
            <p className="text-xs text-text-muted m-0 mt-0.5">
              {status === "TRIALING" && trialEnds
                ? `Included Base access through ${new Date(trialEnds).toLocaleDateString()}. Paid upgrades are coming soon.`
                : "Paid plan checkout is coming soon. Compare plans on the public Pricing page."}
            </p>
          </div>
        </div>
        <Link to="/pricing" className="no-underline shrink-0">
          <Button size="sm" variant="secondary" outline>
            View pricing
          </Button>
        </Link>
      </div>
    );
  }

  if (!showUpgrade && status === "ACTIVE") {
    return (
      <div className="rounded-xl border border-card-border bg-card px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-primary-light text-primary flex items-center justify-center shrink-0">
            <FiCreditCard className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary m-0">
              {planName} · {status}
            </p>
            <p className="text-xs text-text-muted m-0 mt-0.5">
              Practice tools for this workspace. Marketplace bookings are separate.
            </p>
          </div>
        </div>
        <Link to="/lawyer/billing/subscription" className="no-underline shrink-0">
          <Button size="sm" variant="secondary" outline>
            Billing
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-primary bg-primary-light px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-primary text-primary-text flex items-center justify-center shrink-0">
          <FiCreditCard className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary m-0">
            {locked
              ? "Practice locked — subscribe to continue"
              : status === "TRIALING"
                ? `Base trial${trialEnds ? ` · ends ${new Date(trialEnds).toLocaleDateString()}` : ""}`
                : `${planName} plan`}
          </p>
          <p className="text-xs text-text-secondary m-0 mt-0.5">
            {locked
              ? "Your free Base trial ended or billing is past due. Subscribe to unlock cases, AI, and documents."
              : status === "TRIALING"
                ? "Subscribe to Adal Base or Max to keep practice tools after the trial."
                : "Upgrade to Adal Max for more AI and capacity — or create a firm for your team."}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 shrink-0">
        <Link to="/pricing" className="no-underline">
          <Button size="sm" variant="secondary" outline>
            Pricing
          </Button>
        </Link>
        <Link to="/lawyer/billing/subscription" className="no-underline">
          <Button size="sm">Billing</Button>
        </Link>
      </div>
    </div>
  );
}
