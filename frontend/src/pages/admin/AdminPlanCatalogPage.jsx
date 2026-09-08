import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft, FiLayers } from "react-icons/fi";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Input,
  PageHeader,
  PageShell,
  StateHandler
} from "../../components/ui";
import { mergeCatalogPlans, PLAN_KEYS, PLAN_LIMIT_ROWS } from "../../billing/plans";
import { adminBillingApi } from "../../services/billing.api";
import { useToast } from "../../hooks/useToast";
import { getErrorMessage } from "../../utils/errorHandler";

const EMPTY_EDIT = {
  name: "",
  displayPrice: "",
  "cases.active": "",
  "ai.messages_per_month": "",
  "docs.count": "",
  "docs.storage_mb": "",
  seats: "",
  create_firm: false
};

function planToEdit(plan) {
  return {
    name: plan.name || "",
    displayPrice: plan.displayPriceMonthly != null ? String(plan.displayPriceMonthly) : "",
    "cases.active": String(plan.limits?.["cases.active"] ?? ""),
    "ai.messages_per_month": String(plan.limits?.["ai.messages_per_month"] ?? ""),
    "docs.count": String(plan.limits?.["docs.count"] ?? ""),
    "docs.storage_mb": String(plan.limits?.["docs.storage_mb"] ?? ""),
    seats: String(plan.limits?.seats ?? ""),
    create_firm: Boolean(plan.features?.["features.create_firm"])
  };
}

export default function AdminPlanCatalogPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [catalog, setCatalog] = useState(null);
  const [edits, setEdits] = useState({});
  const [busyKey, setBusyKey] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminBillingApi.catalog();
      setCatalog(res.data);
      const merged = mergeCatalogPlans(res.data?.plans || []);
      const next = {};
      for (const p of merged) next[p.key] = planToEdit(p);
      setEdits(next);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const plans = useMemo(() => mergeCatalogPlans(catalog?.plans || []), [catalog?.plans]);

  const updateField = (planKey, field, value) => {
    setEdits((prev) => ({
      ...prev,
      [planKey]: { ...(prev[planKey] || EMPTY_EDIT), [field]: value }
    }));
  };

  const save = async (planKey) => {
    const e = edits[planKey] || EMPTY_EDIT;
    try {
      setBusyKey(planKey);
      await adminBillingApi.updatePlan(planKey, {
        name: e.name,
        displayPrice: Number(e.displayPrice),
        limits: {
          "cases.active": Number(e["cases.active"]),
          "ai.messages_per_month": Number(e["ai.messages_per_month"]),
          "docs.count": Number(e["docs.count"]),
          "docs.storage_mb": Number(e["docs.storage_mb"]),
          seats: Number(e.seats)
        },
        features: { "features.create_firm": Boolean(e.create_firm) }
      });
      toast.success("Plan saved");
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyKey(null);
    }
  };

  const reset = async (planKey) => {
    if (!window.confirm(`Reset ${planKey} entitlements to code defaults?`)) return;
    try {
      setBusyKey(planKey);
      await adminBillingApi.resetPlan(planKey);
      toast.success("Plan reset");
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <StateHandler loading={loading} error={error} retry={load}>
      <PageShell>
        <Link
          to="/admin/subscriptions"
          className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary no-underline mb-2"
        >
          <FiArrowLeft className="w-4 h-4" /> Back
        </Link>
        <PageHeader
          icon={FiLayers}
          title="Plan catalog"
          subtitle="Edit entitlements and display prices. Stripe charge amounts stay in Dashboard / env."
          actions={
            <Badge
              variant={catalog?.stripeConfigured ? "success" : "warning"}
              size="md"
              bordered
            >
              Stripe {catalog?.stripeConfigured ? "configured" : "not configured"}
            </Badge>
          }
        />

        <p className="text-sm text-text-muted m-0 mb-6">
          Changes apply to all workspaces on that plan on the next entitlement check. Seat overrides
          already stored on a subscription are not auto-rewritten.
          {catalog?.trial ? (
            <>
              {" "}
              Trial: {catalog.trial.days} days at{" "}
              <strong>{catalog.trial.planKey}</strong> limits.
            </>
          ) : null}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {plans.map((plan) => {
            const e = edits[plan.key] || EMPTY_EDIT;
            const personal =
              plan.key === PLAN_KEYS.BASE || plan.key === PLAN_KEYS.MAX;
            return (
              <Card key={plan.key} className="!p-5">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <h3 className="text-lg font-bold text-text-primary m-0">{plan.name}</h3>
                  <Badge size="sm">{plan.key}</Badge>
                  {plan.stripePriceConfigured ? (
                    <Badge variant="success" size="sm">
                      Stripe mapped
                    </Badge>
                  ) : (
                    <Badge variant="warning" size="sm">
                      Stripe not mapped
                    </Badge>
                  )}
                </div>

                <Input
                  label="Display name"
                  value={e.name}
                  onChange={(ev) => updateField(plan.key, "name", ev.target.value)}
                />
                <Input
                  label="Display price (PKR / month)"
                  type="number"
                  value={e.displayPrice}
                  onChange={(ev) => updateField(plan.key, "displayPrice", ev.target.value)}
                />

                {PLAN_LIMIT_ROWS.map(({ key, label }) => (
                  <Input
                    key={key}
                    label={label}
                    type="number"
                    value={e[key]}
                    onChange={(ev) => updateField(plan.key, key, ev.target.value)}
                  />
                ))}

                <div className="mb-4">
                  <Checkbox
                    checked={e.create_firm}
                    onChange={(ev) => updateField(plan.key, "create_firm", ev.target.checked)}
                    label="features.create_firm"
                  />
                  {personal ? (
                    <p className="text-xs text-text-muted m-0 mt-1">
                      Personal checkout still cannot create firms; firm create uses Law Firm Plan
                      checkout.
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button loading={busyKey === plan.key} onClick={() => save(plan.key)}>
                    Save
                  </Button>
                  <Button
                    variant="secondary"
                    outline
                    loading={busyKey === plan.key}
                    onClick={() => reset(plan.key)}
                  >
                    Reset to defaults
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </PageShell>
    </StateHandler>
  );
}
