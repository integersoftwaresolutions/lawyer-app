import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Navbar } from "../../components/layout";
import Footer from "../../components/Footer";
import { useAuth } from "../../hooks/useAuth";
import { FiArrowRight } from "react-icons/fi";
import PlanComparisonCards from "../../components/billing/PlanComparisonCards";
import { getDefaultPlans, mergeCatalogPlans, resolvePublicPricingCta } from "../../billing/plans";
import { billingApi } from "../../services/billing.api";
import { BILLING_COMING_SOON } from "../../config/features";

/**
 * Public pricing — live catalog. In-app checkout is gated; signup still grants Base trial.
 */
export default function PricingPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState(getDefaultPlans());
  const [trial, setTrial] = useState({ days: 30, planKey: "base" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await billingApi.publicPlans();
        if (cancelled) return;
        if (res.data?.plans) setPlans(mergeCatalogPlans(res.data.plans));
        if (res.data?.trial) setTrial(res.data.trial);
      } catch {
        /* keep defaults */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const audienceNote =
    user?.role === "CLIENT"
      ? "You don’t need a subscription to book lawyers. Plans below are for legal professionals."
      : user?.role === "LAWYER"
        ? "You're signed in. Paid plan checkout is coming soon — new lawyers already receive a one-month Base plan."
        : "For lawyers and firms. Clients browse and book without a subscription.";

  const footnote = useMemo(() => {
    const trialLabel = trial.planKey === "base" ? "Base" : trial.planKey;
    if (BILLING_COMING_SOON) {
      return `New lawyers get a ${trial.days}-day ${trialLabel}-level plan on signup. Paid upgrades and checkout are coming soon.`;
    }
    return `New lawyers get a ${trial.days}-day ${trialLabel}-level trial on their personal workspace. Billing is per workspace — firm members inherit the firm plan while that workspace is active.`;
  }, [trial]);

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="border-b border-border">
          <div className="max-w-[1100px] mx-auto px-6 py-14 sm:py-20 text-center">
            <p className="text-sm font-semibold text-primary m-0 mb-3 tracking-wide uppercase">
              Pricing
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold text-text-primary m-0 leading-tight">
              Plans for modern legal practice
            </h1>
            <p className="text-lg text-text-secondary max-w-[640px] mx-auto m-0 mt-4">
              Adal Base, Adal Max, and Law Firm plans unlock cases, AI, documents, and seats.
              Marketplace profile and bookings are included on every plan.
            </p>
            <p className="text-sm text-text-muted max-w-[560px] mx-auto m-0 mt-3">{audienceNote}</p>
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <PlanComparisonCards
            plans={plans}
            ctaMode="link"
            getHref={(plan) => resolvePublicPricingCta(plan, user).href}
            getLabel={(plan) => resolvePublicPricingCta(plan, user).label}
            footnote={footnote}
          />

          <div className="mt-14 grid gap-4 sm:grid-cols-2 max-w-3xl mx-auto">
            <div className="rounded-xl border border-border bg-card p-5 text-left">
              <h2 className="text-base font-semibold text-text-primary m-0">For clients</h2>
              <p className="text-sm text-text-secondary m-0 mt-2">
                No subscription. Search verified lawyers, book consultations, and pay per session.
              </p>
              <Link
                to={user ? "/lawyers" : "/register?role=client"}
                className="inline-flex items-center gap-1 text-sm font-semibold text-link no-underline mt-3 hover:underline"
              >
                {user ? "Find lawyers" : "Create client account"}
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 text-left">
              <h2 className="text-base font-semibold text-text-primary m-0">Want a walkthrough?</h2>
              <p className="text-sm text-text-secondary m-0 mt-2">
                Book a demo or request setup help for your firm—no account required.
              </p>
              <Link
                to="/request-demo"
                className="inline-flex items-center gap-1 text-sm font-semibold text-link no-underline mt-3 hover:underline"
              >
                Request a demo
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
