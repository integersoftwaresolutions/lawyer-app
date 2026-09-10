/**
 * Plan keys, limit keys, and immutable structural defaults.
 * Effective limits/features/name/displayPrice come from Mongo PlanDefinition overlays
 * via getResolvedPlan / listResolvedPlans.
 */

export const PLAN_KEYS = Object.freeze({
  BASE: "base",
  MAX: "max",
  FIRM: "firm",
  FIRM_MAX: "firm_max"
});

export const LIMIT_KEYS = Object.freeze({
  CASES_ACTIVE: "cases.active",
  AI_MESSAGES_PER_MONTH: "ai.messages_per_month",
  DOCS_COUNT: "docs.count",
  DOCS_STORAGE_MB: "docs.storage_mb",
  SEATS: "seats"
});

export const FEATURE_KEYS = Object.freeze({
  CREATE_FIRM: "features.create_firm"
});

export const PLAN_LIMIT_ERROR_CODES = Object.freeze({
  CASES_ACTIVE: "PLAN_LIMIT_CASES",
  AI_MESSAGES: "PLAN_LIMIT_AI",
  DOCS_COUNT: "PLAN_LIMIT_DOCS",
  DOCS_STORAGE: "PLAN_LIMIT_STORAGE",
  SEATS: "PLAN_LIMIT_SEATS",
  CREATE_FIRM: "PLAN_LIMIT_CREATE_FIRM",
  BILLING_LOCKED: "PLAN_BILLING_LOCKED"
});

/** @typedef {{ key: string, name: string, workspaceTypes: string[], limits: Record<string, number>, features: Record<string, boolean>, stripePriceEnv?: string, displayPrice?: number }} PlanDefinitionShape */

/** Frozen code defaults — seed source and fallback if DB missing. */
export const DEFAULT_PLAN_CATALOG = Object.freeze({
  [PLAN_KEYS.BASE]: Object.freeze({
    key: PLAN_KEYS.BASE,
    name: "Adal Base",
    workspaceTypes: Object.freeze(["PERSONAL"]),
    limits: Object.freeze({
      [LIMIT_KEYS.CASES_ACTIVE]: 10,
      [LIMIT_KEYS.AI_MESSAGES_PER_MONTH]: 50,
      [LIMIT_KEYS.DOCS_COUNT]: 50,
      [LIMIT_KEYS.DOCS_STORAGE_MB]: 500,
      [LIMIT_KEYS.SEATS]: 1
    }),
    features: Object.freeze({
      [FEATURE_KEYS.CREATE_FIRM]: false
    }),
    stripePriceEnv: "STRIPE_PRICE_BASE_MONTHLY",
    displayPrice: 1000
  }),
  [PLAN_KEYS.MAX]: Object.freeze({
    key: PLAN_KEYS.MAX,
    name: "Adal Max",
    workspaceTypes: Object.freeze(["PERSONAL"]),
    limits: Object.freeze({
      [LIMIT_KEYS.CASES_ACTIVE]: 50,
      [LIMIT_KEYS.AI_MESSAGES_PER_MONTH]: 500,
      [LIMIT_KEYS.DOCS_COUNT]: 500,
      [LIMIT_KEYS.DOCS_STORAGE_MB]: 5000,
      [LIMIT_KEYS.SEATS]: 1
    }),
    features: Object.freeze({
      [FEATURE_KEYS.CREATE_FIRM]: false
    }),
    stripePriceEnv: "STRIPE_PRICE_MAX_MONTHLY",
    displayPrice: 3000
  }),
  [PLAN_KEYS.FIRM]: Object.freeze({
    key: PLAN_KEYS.FIRM,
    name: "Law Firm Plan",
    workspaceTypes: Object.freeze(["FIRM"]),
    limits: Object.freeze({
      [LIMIT_KEYS.CASES_ACTIVE]: 100,
      [LIMIT_KEYS.AI_MESSAGES_PER_MONTH]: 1000,
      [LIMIT_KEYS.DOCS_COUNT]: 1000,
      [LIMIT_KEYS.DOCS_STORAGE_MB]: 10000,
      [LIMIT_KEYS.SEATS]: 5
    }),
    features: Object.freeze({
      [FEATURE_KEYS.CREATE_FIRM]: true
    }),
    stripePriceEnv: "STRIPE_PRICE_FIRM_MONTHLY",
    displayPrice: 4000
  }),
  [PLAN_KEYS.FIRM_MAX]: Object.freeze({
    key: PLAN_KEYS.FIRM_MAX,
    name: "Law Firm Max",
    workspaceTypes: Object.freeze(["FIRM"]),
    limits: Object.freeze({
      [LIMIT_KEYS.CASES_ACTIVE]: 250,
      [LIMIT_KEYS.AI_MESSAGES_PER_MONTH]: 3000,
      [LIMIT_KEYS.DOCS_COUNT]: 2000,
      [LIMIT_KEYS.DOCS_STORAGE_MB]: 25000,
      [LIMIT_KEYS.SEATS]: 7
    }),
    features: Object.freeze({
      [FEATURE_KEYS.CREATE_FIRM]: true
    }),
    stripePriceEnv: "STRIPE_PRICE_FIRM_MAX_MONTHLY",
    displayPrice: 10000
  })
});

/** @deprecated Use DEFAULT_PLAN_CATALOG — alias for older imports during migration */
export const PLAN_CATALOG = DEFAULT_PLAN_CATALOG;

export function getDefaultPlanDefinition(planKey) {
  const plan = DEFAULT_PLAN_CATALOG[planKey];
  if (!plan) throw new Error(`Unknown plan key: ${planKey}`);
  return plan;
}

/** Sync defaults only — prefer getResolvedPlan for entitlements. */
export function getPlanDefinition(planKey) {
  return getDefaultPlanDefinition(planKey);
}

export function listDefaultPlans() {
  return Object.values(DEFAULT_PLAN_CATALOG);
}

export function listPlans() {
  return listDefaultPlans();
}

export function resolvePlanKeyFromPriceId(priceId, priceMap) {
  if (!priceId) return null;
  for (const [key, id] of Object.entries(priceMap || {})) {
    if (id && id === priceId) return key;
  }
  return null;
}

/** Effective entitlements while TRIALING use Base limits. Unpaid/expired → base. */
export function entitlementsPlanKey(subscription) {
  if (!subscription) return PLAN_KEYS.BASE;
  if (subscription.status === "TRIALING") return PLAN_KEYS.BASE;
  if (subscription.status === "ACTIVE" || subscription.status === "PAST_DUE") {
    return subscription.planKey || PLAN_KEYS.BASE;
  }
  return PLAN_KEYS.BASE;
}

export function isPersonalPlan(planKey) {
  return planKey === PLAN_KEYS.BASE || planKey === PLAN_KEYS.MAX;
}

export function isFirmPlan(planKey) {
  return planKey === PLAN_KEYS.FIRM || planKey === PLAN_KEYS.FIRM_MAX;
}

/** Firm create defaults to Law Firm Plan if an invalid/missing key is sent. */
export function resolveFirmCreatePlanKey(planKey) {
  return isFirmPlan(planKey) ? planKey : PLAN_KEYS.FIRM;
}

export function isValidPlanKey(planKey) {
  return Object.values(PLAN_KEYS).includes(planKey);
}
