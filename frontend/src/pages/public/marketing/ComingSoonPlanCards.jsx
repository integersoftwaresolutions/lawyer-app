import { FiCheck } from "react-icons/fi";
import { PUBLIC_PLANS } from "./publicPlans";

/**
 * Display-only plan cards for public pricing. No checkout / no links on plan CTAs.
 */
export default function ComingSoonPlanCards({
  plans = PUBLIC_PLANS,
  footnote = null
}) {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 sm:gap-5 items-stretch">
        {plans.map((plan) => (
          <div
            key={plan.key}
            className={`relative flex flex-col rounded-2xl border bg-card p-5 sm:p-6 text-left ${
              plan.popular
                ? "border-primary shadow-md"
                : "border-border"
            }`}
          >
            {(plan.popular || plan.badge) && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-text text-[11px] font-semibold whitespace-nowrap">
                {plan.badge || "Most popular"}
              </div>
            )}

            <p className="m-0 text-sm font-semibold text-text-primary">{plan.name}</p>
            <p className="m-0 mt-1 text-xs text-text-muted leading-snug">{plan.tagline}</p>

            <div className="mt-4 mb-1">
              <span className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
                {plan.priceLabel}
              </span>
              {plan.period ? (
                <span className="text-sm text-text-muted ml-1">/ {plan.period}</span>
              ) : null}
            </div>

            <ul className="m-0 mt-4 p-0 list-none space-y-2.5 flex-1">
              {plan.points.map((point) => (
                <li key={point} className="flex gap-2 text-sm text-text-secondary">
                  <FiCheck className="h-4 w-4 text-success shrink-0 mt-0.5" aria-hidden />
                  <span>{point}</span>
                </li>
              ))}
            </ul>

            <div
              className="mt-6 w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-center text-sm font-semibold text-text-muted select-none"
              aria-disabled="true"
            >
              Coming soon
            </div>
          </div>
        ))}
      </div>

      {footnote ? (
        <p className="m-0 mt-8 text-center text-sm text-text-muted leading-relaxed max-w-2xl mx-auto">
          {footnote}
        </p>
      ) : null}
    </div>
  );
}
