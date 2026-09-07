/**
 * Single source of plan definitions, limit keys, and Stripe price mappings.
 * Add a plan or limit here — features must go through EntitlementService, not plan string checks.
 */

export const PLAN_KEYS = Object.freeze({
  FREE: "free",
  PRO: "pro",
  FIRM: "firm"
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

/** @typedef {{ key: string, name: string, workspaceTypes: string[], limits: Record<string, number>, features: Record<string, boolean>, stripePriceEnv?: string }} PlanDefinition */

/** @type {Record<string, PlanDefinition>} */
export const PLAN_CATALOG = Object.freeze({
  [PLAN_KEYS.FREE]: Object.freeze({
    key: PLAN_KEYS.FREE,
    name: "Free",
    workspaceTypes: ["PERSONAL"],
    limits: Object.freeze({
      [LIMIT_KEYS.CASES_ACTIVE]: 5,
      [LIMIT_KEYS.AI_MESSAGES_PER_MONTH]: 20,
      [LIMIT_KEYS.DOCS_COUNT]: 25,
      [LIMIT_KEYS.DOCS_STORAGE_MB]: 200,
      [LIMIT_KEYS.SEATS]: 1
    }),
    features: Object.freeze({
      [FEATURE_KEYS.CREATE_FIRM]: false
    })
  }),
  [PLAN_KEYS.PRO]: Object.freeze({
    key: PLAN_KEYS.PRO,
    name: "Pro",
    workspaceTypes: ["PERSONAL"],
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
    stripePriceEnv: "STRIPE_PRICE_PRO_MONTHLY"
  }),
  [PLAN_KEYS.FIRM]: Object.freeze({
    key: PLAN_KEYS.FIRM,
    name: "Firm",
    workspaceTypes: ["FIRM"],
    limits: Object.freeze({
      [LIMIT_KEYS.CASES_ACTIVE]: 200,
      [LIMIT_KEYS.AI_MESSAGES_PER_MONTH]: 2000,
      [LIMIT_KEYS.DOCS_COUNT]: 2000,
      [LIMIT_KEYS.DOCS_STORAGE_MB]: 20000,
      [LIMIT_KEYS.SEATS]: 10
    }),
    features: Object.freeze({
      [FEATURE_KEYS.CREATE_FIRM]: true
    }),
    stripePriceEnv: "STRIPE_PRICE_FIRM_MONTHLY"
  })
});

export function getPlanDefinition(planKey) {
  const plan = PLAN_CATALOG[planKey];
  if (!plan) throw new Error(`Unknown plan key: ${planKey}`);
  return plan;
}

export function listPlans() {
  return Object.values(PLAN_CATALOG);
}

export function resolvePlanKeyFromPriceId(priceId, priceMap) {
  if (!priceId) return null;
  for (const [key, id] of Object.entries(priceMap || {})) {
    if (id && id === priceId) return key;
  }
  return null;
}

/** Effective entitlements while TRIALING use Pro limits. */
export function entitlementsPlanKey(subscription) {
  if (!subscription) return PLAN_KEYS.FREE;
  if (subscription.status === "TRIALING") return PLAN_KEYS.PRO;
  if (subscription.status === "ACTIVE" || subscription.status === "PAST_DUE") {
    return subscription.planKey || PLAN_KEYS.FREE;
  }
  return PLAN_KEYS.FREE;
}
