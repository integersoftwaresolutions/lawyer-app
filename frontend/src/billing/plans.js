import { BILLING_COMING_SOON } from "../config/features";

/**
 * Frontend plan display defaults. Live limits/prices prefer /api/billing/plans.
 */

export const PLAN_KEYS = Object.freeze({
  BASE: "base",
  MAX: "max",
  FIRM: "firm",
  FIRM_MAX: "firm_max"
});

export const DEFAULT_PLANS = Object.freeze([
  {
    key: PLAN_KEYS.BASE,
    name: "Adal Base",
    tagline: "Solo practice essentials",
    workspaceTypes: ["PERSONAL"],
    displayPriceMonthly: 1000,
    currency: "pkr",
    popular: false,
    limits: {
      "cases.active": 10,
      "ai.messages_per_month": 50,
      "docs.count": 50,
      "docs.storage_mb": 500,
      seats: 1
    },
    features: { "features.create_firm": false },
    highlights: ["30-day Base trial for new lawyers", "1 seat", "Limited AI"]
  },
  {
    key: PLAN_KEYS.MAX,
    name: "Adal Max",
    tagline: "Extended AI for growing solos",
    workspaceTypes: ["PERSONAL"],
    displayPriceMonthly: 3000,
    currency: "pkr",
    popular: true,
    limits: {
      "cases.active": 50,
      "ai.messages_per_month": 500,
      "docs.count": 500,
      "docs.storage_mb": 5000,
      seats: 1
    },
    features: { "features.create_firm": false },
    highlights: ["1 seat", "Extended AI", "Higher practice capacity"]
  },
  {
    key: PLAN_KEYS.FIRM,
    name: "Law Firm Plan",
    tagline: "Team workspace for small firms",
    workspaceTypes: ["FIRM"],
    displayPriceMonthly: 4000,
    currency: "pkr",
    popular: false,
    limits: {
      "cases.active": 100,
      "ai.messages_per_month": 1000,
      "docs.count": 1000,
      "docs.storage_mb": 10000,
      seats: 5
    },
    features: { "features.create_firm": true },
    highlights: ["Up to 5 seats", "Roles & invites", "Shared workspace"]
  },
  {
    key: PLAN_KEYS.FIRM_MAX,
    name: "Law Firm Max",
    tagline: "Larger teams with extended AI",
    workspaceTypes: ["FIRM"],
    displayPriceMonthly: 10000,
    currency: "pkr",
    popular: false,
    limits: {
      "cases.active": 250,
      "ai.messages_per_month": 3000,
      "docs.count": 2000,
      "docs.storage_mb": 25000,
      seats: 7
    },
    features: { "features.create_firm": true },
    highlights: ["Up to 7 seats", "Extended AI", "Firm collaboration"]
  }
]);

export function getDefaultPlans() {
  return DEFAULT_PLANS.map((p) => ({
    ...p,
    limits: { ...p.limits },
    features: { ...p.features },
    highlights: [...(p.highlights || [])],
    workspaceTypes: [...(p.workspaceTypes || [])]
  }));
}

/**
 * Merge API catalog into display plans. Prefer API keys; keep defaults for missing fields.
 */
export function mergeCatalogPlans(apiPlans) {
  const defaults = getDefaultPlans();
  const byKey = Object.fromEntries(defaults.map((p) => [p.key, p]));
  const apiList = Array.isArray(apiPlans) ? apiPlans : [];

  const keys = [
    ...new Set([...defaults.map((p) => p.key), ...apiList.map((p) => p.key).filter(Boolean)])
  ];

  return keys
    .map((key) => {
      const base = byKey[key] || {
        key,
        name: key,
        tagline: "",
        workspaceTypes: [],
        displayPriceMonthly: null,
        currency: "pkr",
        popular: key === PLAN_KEYS.MAX,
        limits: {},
        features: {},
        highlights: []
      };
      const api = apiList.find((p) => p.key === key);
      if (!api) return base;
      return {
        ...base,
        name: api.name || base.name,
        workspaceTypes: api.workspaceTypes || base.workspaceTypes,
        limits: { ...base.limits, ...(api.limits || {}) },
        features: { ...base.features, ...(api.features || {}) },
        displayPriceMonthly:
          api.displayPriceMonthly != null ? api.displayPriceMonthly : base.displayPriceMonthly,
        currency: (api.currency || base.currency || "pkr").toLowerCase(),
        stripePriceConfigured: Boolean(api.stripePriceConfigured),
        version: api.version,
        updatedAt: api.updatedAt
      };
    })
    .filter((p) => Object.values(PLAN_KEYS).includes(p.key));
}

export function formatPlanPrice(plan) {
  const amount = Number(plan?.displayPriceMonthly);
  const currency = (plan?.currency || "pkr").toLowerCase();
  if (!Number.isFinite(amount)) return { primary: "—", secondary: null };
  if (amount === 0) return { primary: "Free", secondary: null };
  if (currency === "pkr" || currency === "rs") {
    return {
      primary: `Rs ${amount.toLocaleString("en-PK")}`,
      secondary: "/ month"
    };
  }
  if (currency === "usd") {
    return { primary: `$${amount}`, secondary: "/ month" };
  }
  return {
    primary: `${currency.toUpperCase()} ${amount.toLocaleString()}`,
    secondary: "/ month"
  };
}

export const PLAN_LIMIT_ROWS = Object.freeze([
  { key: "cases.active", label: "Active cases" },
  { key: "ai.messages_per_month", label: "AI messages / month" },
  { key: "docs.count", label: "Documents" },
  { key: "docs.storage_mb", label: "Storage" },
  { key: "seats", label: "Seats" }
]);

export function formatStorageMb(mb) {
  const n = Number(mb);
  if (!Number.isFinite(n)) return "—";
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)} GB`;
  return `${n} MB`;
}

export function formatPlanLimitValue(key, value) {
  if (value == null) return "—";
  if (key === "docs.storage_mb") return formatStorageMb(value);
  return String(value);
}

export function formatWorkspaceTypeLabel(types = []) {
  if (!types?.length) return "—";
  return types.map((t) => (t === "PERSONAL" ? "Personal" : t === "FIRM" ? "Firm" : t)).join(", ");
}

export function resolvePublicPricingCta(plan, user) {
  const role = user?.role;
  if (BILLING_COMING_SOON) {
    if (role === "CLIENT") {
      return { label: "Browse lawyers", href: "/lawyers" };
    }
    if (role === "ADMIN") {
      return { label: "Admin subscriptions", href: "/admin/subscriptions" };
    }
    if (!role && plan.key === PLAN_KEYS.BASE) {
      return { label: "Start free trial", href: "/register?role=lawyer" };
    }
    return { label: "Coming soon", href: null };
  }
  if (role === "CLIENT") {
    return { label: "Browse lawyers", href: "/lawyers" };
  }
  if (role === "LAWYER") {
    if (plan.key === PLAN_KEYS.FIRM || plan.key === PLAN_KEYS.FIRM_MAX) {
      return {
        label: plan.key === PLAN_KEYS.FIRM_MAX ? "Get Firm Max in billing" : "Get Firm in billing",
        href: `/lawyer/billing/subscription?upgrade=${plan.key}`
      };
    }
    return {
      label: plan.key === PLAN_KEYS.MAX ? "Upgrade in billing" : "Open billing",
      href: `/lawyer/billing/subscription?upgrade=${plan.key}`
    };
  }
  if (role === "ADMIN") {
    return { label: "Admin subscriptions", href: "/admin/subscriptions" };
  }
  if (plan.key === PLAN_KEYS.FIRM || plan.key === PLAN_KEYS.FIRM_MAX) {
    return { label: "Start with Firm", href: "/register?role=lawyer&plan=firm" };
  }
  if (plan.key === PLAN_KEYS.BASE) {
    return { label: "Start free trial", href: "/register?role=lawyer&plan=base" };
  }
  return { label: "Get Adal Max", href: "/register?role=lawyer&plan=max" };
}

export function planCtaLabel(planKey, { currentPlanKey, isLoggedIn } = {}) {
  if (planKey === PLAN_KEYS.BASE) return isLoggedIn ? "Current / Base" : "Start free trial";
  if (planKey === PLAN_KEYS.FIRM) return "Get Firm";
  if (planKey === PLAN_KEYS.FIRM_MAX) return "Get Firm Max";
  if (planKey === PLAN_KEYS.MAX) {
    if (currentPlanKey === PLAN_KEYS.MAX) return "Current plan";
    return "Upgrade to Max";
  }
  return "Get started";
}
