import {
  FiCheck,
  FiDatabase,
  FiFileText,
  FiLayers,
  FiMessageSquare,
  FiUsers,
  FiX
} from "react-icons/fi";
import { Link } from "react-router-dom";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import {
  formatPlanLimitValue,
  formatPlanPrice,
  formatWorkspaceTypeLabel,
  PLAN_KEYS,
  PLAN_LIMIT_ROWS
} from "../../billing/plans";

const LIMIT_ICONS = {
  "cases.active": FiLayers,
  "ai.messages_per_month": FiMessageSquare,
  "docs.count": FiFileText,
  "docs.storage_mb": FiDatabase,
  seats: FiUsers
};

/**
 * Shared Free / Pro / Firm plan cards for pricing, billing, and admin catalog.
 */
export default function PlanComparisonCards({
  plans = [],
  currentPlanKey = null,
  highlightCurrent = false,
  onSelectPlan,
  busyPlanKey = null,
  ctaMode = "link", // link | button | none
  getHref,
  getLabel,
  showAdminMeta = false,
  footnote = null
}) {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-stretch">
        {plans.map((plan) => {
          const price = formatPlanPrice(plan);
          const isCurrent =
            highlightCurrent &&
            currentPlanKey &&
            String(currentPlanKey).toLowerCase() === plan.key;
          const label =
            getLabel?.(plan) ||
            (plan.key === PLAN_KEYS.PRO
              ? "Upgrade to Pro"
              : plan.key === PLAN_KEYS.FIRM
                ? "Get Firm"
                : "Get started");
          const href = getHref?.(plan);
          const busy = busyPlanKey === plan.key;
          const isPopular = plan.popular && !isCurrent;
          const createFirm = Boolean(plan.features?.["features.create_firm"]);
          const priceMapped =
            plan.key === PLAN_KEYS.FREE || Boolean(plan.stripePriceConfigured);
          const showCta = ctaMode !== "none";

          return (
            <div
              key={plan.key}
              className={`relative flex flex-col rounded-2xl border bg-card p-6 sm:p-8 text-left transition-shadow ${
                isPopular || isCurrent
                  ? "border-primary shadow-lg md:scale-[1.02]"
                  : "border-border hover:shadow-md"
              }`}
            >
              {(isPopular || isCurrent) && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-text text-[11px] font-semibold whitespace-nowrap">
                  {isCurrent ? "Your plan" : "Most popular"}
                </div>
              )}

              {showAdminMeta ? (
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {(plan.workspaceTypes || []).map((type) => (
                    <Badge key={type} variant="primary" size="sm">
                      {formatWorkspaceTypeLabel(type)}
                    </Badge>
                  ))}
                  <Badge variant={priceMapped ? "success" : "warning"} size="sm">
                    {plan.key === PLAN_KEYS.FREE
                      ? "No Stripe price"
                      : priceMapped
                        ? "Price mapped"
                        : "Price not mapped"}
                  </Badge>
                </div>
              ) : null}

              <div className="mb-1">
                <h3 className="text-xl font-bold text-text-primary m-0">{plan.name}</h3>
                <p className="text-sm text-text-secondary m-0 mt-1">{plan.tagline}</p>
              </div>

              <div className="mt-4 mb-6">
                <span className="text-4xl sm:text-5xl font-bold text-text-primary">
                  {price.primary}
                </span>
                {price.secondary ? (
                  <span className="text-text-secondary text-base ml-1">{price.secondary}</span>
                ) : null}
              </div>

              <ul className={`list-none p-0 m-0 space-y-3 flex-1 ${showCta ? "mb-8" : ""}`}>
                {PLAN_LIMIT_ROWS.map(({ key, label: limitLabel }) => {
                  const raw = plan.limits?.[key];
                  if (raw == null) return null;
                  const Icon = LIMIT_ICONS[key] || FiLayers;
                  return (
                    <li
                      key={key}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="inline-flex items-center gap-2 text-text-secondary min-w-0">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-surface border border-border shrink-0">
                          <Icon className="w-4 h-4 text-primary" />
                        </span>
                        <span className="truncate">{limitLabel}</span>
                      </span>
                      <strong className="text-text-primary font-semibold tabular-nums shrink-0">
                        {formatPlanLimitValue(key, raw)}
                      </strong>
                    </li>
                  );
                })}

                <li className="flex items-center justify-between gap-3 text-sm pt-1 border-t border-border">
                  <span className="inline-flex items-center gap-2 text-text-secondary min-w-0">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-surface border border-border shrink-0">
                      {createFirm ? (
                        <FiCheck className="w-4 h-4 text-success" />
                      ) : (
                        <FiX className="w-4 h-4 text-text-muted" />
                      )}
                    </span>
                    <span className="truncate">Create firm workspace</span>
                  </span>
                  <Badge variant={createFirm ? "success" : "default"} size="sm">
                    {createFirm ? "Included" : "Not included"}
                  </Badge>
                </li>
              </ul>

              {ctaMode === "link" && href ? (
                <Link
                  to={href}
                  className={`py-3 px-4 rounded-lg text-center text-sm font-semibold no-underline transition-colors ${
                    isPopular || plan.key === PLAN_KEYS.PRO
                      ? "bg-primary text-primary-text hover:bg-primary-hover"
                      : "border-2 border-border bg-secondary text-secondary-text hover:bg-secondary-hover"
                  }`}
                >
                  {label}
                </Link>
              ) : null}

              {ctaMode === "button" ? (
                <Button
                  fullWidth
                  loading={busy}
                  disabled={isCurrent && plan.key !== PLAN_KEYS.FIRM}
                  variant={isPopular || plan.key === PLAN_KEYS.PRO ? "primary" : "secondary"}
                  outline={!(isPopular || plan.key === PLAN_KEYS.PRO)}
                  onClick={() => onSelectPlan?.(plan)}
                >
                  {isCurrent && plan.key === PLAN_KEYS.PRO ? "Current plan" : label}
                </Button>
              ) : null}
            </div>
          );
        })}
      </div>
      {footnote ? (
        <p className="text-center text-sm text-text-muted m-0 mt-8 max-w-2xl mx-auto">{footnote}</p>
      ) : null}
    </div>
  );
}
