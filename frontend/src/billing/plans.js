/**
 * Shared lawyer plan display — mirrors backend PlanCatalog limits/features.
 * Display prices can be overridden by /api/billing/plans when available.
 */

export const PLAN_KEYS = Object.freeze({
  FREE: "free",
  PRO: "pro",
  FIRM: "firm"
});

const DEFAULT_PLANS = [
  {
    key: PLAN_KEYS.FREE,
    name: "Free",
    tagline: "Solo practice essentials",
    workspaceTypes: ["PERSONAL"],
    displayPriceMonthly: 0,
    currency: "usd",
    popular: false,
    limits: {
      "cases.active": 5,
      "ai.messages_per_month": 20,
      "docs.count": 25,
      "docs.storage_mb": 200,
      seats: 1
    },
    features: {
      "features.create_firm": false
    },
    highlights: [
      "Marketplace profile & bookings (always included)",
      "5 active cases",
      "20 AI messages / month",
      "25 documents · 200 MB",
      "Personal workspace"
    ]
  },
  {
    key: PLAN_KEYS.PRO,
    name: "Pro",
    tagline: "For growing solo practices",
    workspaceTypes: ["PERSONAL"],
    displayPriceMonthly: Number(import.meta.env.VITE_BILLING_DISPLAY_PRICE_PRO || 29),
    currency: "usd",
    popular: true,
    limits: {
      "cases.active": 50,
      "ai.messages_per_month": 500,
      "docs.count": 500,
      "docs.storage_mb": 5000,
      seats: 1
    },
    features: {
      "features.create_firm": false
    },
    highlights: [
      "Everything in Free",
      "50 active cases",
      "500 AI messages / month",
      "500 documents · 5 GB",
      "14-day Pro trial for new lawyers"
    ]
  },
  {
    key: PLAN_KEYS.FIRM,
    name: "Firm",
    tagline: "Teams, seats & shared quotas",
    workspaceTypes: ["FIRM"],
    displayPriceMonthly: Number(import.meta.env.VITE_BILLING_DISPLAY_PRICE_FIRM || 99),
    currency: "usd",
    popular: false,
    limits: {
      "cases.active": 200,
      "ai.messages_per_month": 2000,
      "docs.count": 2000,
      "docs.storage_mb": 20000,
      seats: 10
    },
    features: {
      "features.create_firm": true
    },
    highlights: [
      "Firm workspace with roles & invites",
      "Up to 10 seats",
      "200 active cases",
      "2,000 AI messages / month (shared)",
      "2,000 documents · 20 GB"
    ]
  }
];

export function getDefaultPlans() {
  return DEFAULT_PLANS.map((p) => ({ ...p, highlights: [...p.highlights] }));
}

/** Merge API catalog into display plans (prices + stripe flags). */
export function mergeCatalogPlans(apiPlans = []) {
  const byKey = Object.fromEntries((apiPlans || []).map((p) => [p.key, p]));
  return getDefaultPlans().map((base) => {
    const api = byKey[base.key];
    if (!api) return base;
    return {
      ...base,
      name: api.name || base.name,
      limits: api.limits || base.limits,
      features: api.features || base.features,
      displayPriceMonthly:
        api.displayPriceMonthly != null ? api.displayPriceMonthly : base.displayPriceMonthly,
      currency: api.currency || base.currency,
      stripePriceConfigured: Boolean(api.stripePriceConfigured)
    };
  });
}

export function formatPlanPrice(plan) {
  const amount = Number(plan.displayPriceMonthly);
  if (!amount) return { primary: "Free", secondary: "" };
  const currency = (plan.currency || "usd").toUpperCase();
  const symbol = currency === "USD" ? "$" : `${currency} `;
  return { primary: `${symbol}${amount}`, secondary: "/mo" };
}

/** Shared limit rows for pricing / catalog cards (single source of truth). */
export const PLAN_LIMIT_ROWS = Object.freeze([
  { key: "cases.active", label: "Active cases" },
  { key: "ai.messages_per_month", label: "AI messages / month" },
  { key: "docs.count", label: "Documents" },
  { key: "docs.storage_mb", label: "Storage" },
  { key: "seats", label: "Seats" }
]);

export function formatStorageMb(mb) {
  const n = Number(mb);
  if (!Number.isFinite(n)) return String(mb);
  if (n >= 1000) {
    const gb = n / 1000;
    return `${Number.isInteger(gb) ? gb : gb.toFixed(1)} GB`;
  }
  return `${n} MB`;
}

export function formatPlanLimitValue(key, value) {
  if (key === "docs.storage_mb") return formatStorageMb(value);
  if (typeof value === "number") return value.toLocaleString();
  return String(value);
}

export function formatWorkspaceTypeLabel(type) {
  if (!type) return "";
  return String(type).charAt(0) + String(type).slice(1).toLowerCase();
}

/**
 * Auth-aware CTA for the public Pricing page (SaaS conversion surface).
 * @returns {{ label: string, href: string }}
 */
export function resolvePublicPricingCta(plan, user) {
  const role = user?.role;

  if (role === "CLIENT") {
    return {
      label: "Browse lawyers",
      href: "/lawyers"
    };
  }

  if (role === "LAWYER") {
    if (plan.key === PLAN_KEYS.PRO) {
      return { label: "Upgrade in billing", href: "/lawyer/billing/subscription?upgrade=pro" };
    }
    if (plan.key === PLAN_KEYS.FIRM) {
      return { label: "Get Firm in billing", href: "/lawyer/billing/subscription?upgrade=firm" };
    }
    return { label: "Open billing", href: "/lawyer/billing/subscription" };
  }

  if (role === "ADMIN") {
    return { label: "Admin subscriptions", href: "/admin/subscriptions" };
  }

  // Signed out
  if (plan.key === PLAN_KEYS.FREE) {
    return { label: "Start free trial", href: "/register?role=lawyer&plan=free" };
  }
  if (plan.key === PLAN_KEYS.FIRM) {
    return { label: "Start with Firm", href: "/register?role=lawyer&plan=firm" };
  }
  return { label: "Get Pro", href: "/register?role=lawyer&plan=pro" };
}

export function planCtaLabel(planKey, { isLoggedInLawyer, currentPlanKey, isFirm } = {}) {
  if (!isLoggedInLawyer) {
    if (planKey === PLAN_KEYS.FREE) return "Start free trial";
    if (planKey === PLAN_KEYS.FIRM) return "Create firm";
    return "Get Pro";
  }
  if (planKey === PLAN_KEYS.FIRM) {
    return isFirm ? "Manage firm billing" : "Create firm workspace";
  }
  if (planKey === PLAN_KEYS.PRO) {
    if (currentPlanKey === "pro" || currentPlanKey === PLAN_KEYS.PRO) return "Current plan";
    return "Upgrade to Pro";
  }
  return "View billing";
}
