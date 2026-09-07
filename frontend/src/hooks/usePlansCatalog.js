import { useEffect, useState } from "react";
import { billingApi } from "../services/billing.api";
import { getDefaultPlans, mergeCatalogPlans } from "../billing/plans";

/** Shared catalog loader for /pricing and in-app billing. */
export function usePlansCatalog() {
  const [plans, setPlans] = useState(getDefaultPlans());
  const [stripeConfigured, setStripeConfigured] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await billingApi.publicPlans();
        if (cancelled) return;
        if (res?.data?.plans) setPlans(mergeCatalogPlans(res.data.plans));
        if (typeof res?.data?.stripeConfigured === "boolean") {
          setStripeConfigured(res.data.stripeConfigured);
        }
      } catch {
        /* defaults */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { plans, stripeConfigured, loading };
}
