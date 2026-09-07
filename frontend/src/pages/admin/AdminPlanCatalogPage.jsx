import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft, FiLayers } from "react-icons/fi";
import { Badge, PageHeader, PageShell, StateHandler } from "../../components/ui";
import PlanComparisonCards from "../../components/billing/PlanComparisonCards";
import { mergeCatalogPlans } from "../../billing/plans";
import { adminBillingApi } from "../../services/billing.api";
import { getErrorMessage } from "../../utils/errorHandler";

export default function AdminPlanCatalogPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [catalog, setCatalog] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminBillingApi.catalog();
      setCatalog(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const plans = useMemo(
    () => mergeCatalogPlans(catalog?.plans || []),
    [catalog?.plans]
  );

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
          subtitle="Read-only limits and feature flags. Edit prices in Stripe Dashboard."
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

        <div className="mt-2">
          <PlanComparisonCards plans={plans} ctaMode="none" showAdminMeta />
        </div>
      </PageShell>
    </StateHandler>
  );
}
