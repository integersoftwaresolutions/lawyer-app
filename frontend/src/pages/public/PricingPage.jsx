import { Link } from "react-router-dom";
import { Navbar } from "../../components/layout";
import Footer from "../../components/Footer";
import PlanComparisonCards from "../../components/billing/PlanComparisonCards";
import { useAuth } from "../../hooks/useAuth";
import { usePlansCatalog } from "../../hooks/usePlansCatalog";
import { resolvePublicPricingCta } from "../../billing/plans";
import { FiArrowRight } from "react-icons/fi";

/**
 * Public conversion Pricing page (Stripe / Notion / GitHub pattern).
 * Auth-aware CTAs; checkout still happens in-app for lawyers (workspace-scoped).
 */
export default function PricingPage() {
  const { user } = useAuth();
  const { plans } = usePlansCatalog();

  const audienceNote =
    user?.role === "CLIENT"
      ? "You don’t need a subscription to book lawyers. Plans below are for legal professionals."
      : user?.role === "LAWYER"
        ? "You’re signed in. Choose a plan to continue in Billing for your active workspace."
        : "For lawyers and firms. Clients browse and book without a subscription.";

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
              Free, Pro, and Firm unlock cases, AI, documents, and seats. Marketplace profile and
              bookings are included on every plan.
            </p>
            <p className="text-sm text-text-muted max-w-[560px] mx-auto m-0 mt-3">{audienceNote}</p>
          </div>
        </div>

        <div className="max-w-[1100px] mx-auto px-6 py-12 sm:py-16">
          <PlanComparisonCards
            plans={plans}
            ctaMode="link"
            getHref={(plan) => resolvePublicPricingCta(plan, user).href}
            getLabel={(plan) => resolvePublicPricingCta(plan, user).label}
            footnote="New lawyers get a 14-day Pro trial on their personal workspace. Billing is per workspace — firm members inherit the firm plan while that workspace is active."
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
              <h2 className="text-base font-semibold text-text-primary m-0">Already a lawyer?</h2>
              <p className="text-sm text-text-secondary m-0 mt-2">
                Manage payment method, invoices, and usage for your active workspace in Billing.
              </p>
              <Link
                to={user?.role === "LAWYER" ? "/lawyer/billing/subscription" : "/login?redirect=/lawyer/billing/subscription"}
                className="inline-flex items-center gap-1 text-sm font-semibold text-link no-underline mt-3 hover:underline"
              >
                {user?.role === "LAWYER" ? "Go to billing" : "Sign in to billing"}
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
