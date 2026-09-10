import PlanDefinition from "../models/PlanDefinition.js";
import {
  DEFAULT_PLAN_CATALOG,
  PLAN_KEYS,
  LIMIT_KEYS,
  FEATURE_KEYS,
  getDefaultPlanDefinition,
  isValidPlanKey
} from "./planCatalog.js";
import { ApiError } from "../helpers/apiError.js";

let cache = null;
let cacheAt = 0;
const CACHE_TTL_MS = 30_000;

export function invalidatePlanCatalogCache() {
  cache = null;
  cacheAt = 0;
}

function clonePlan(plan) {
  return {
    key: plan.key,
    name: plan.name,
    workspaceTypes: [...(plan.workspaceTypes || [])],
    limits: { ...plan.limits },
    features: { ...plan.features },
    stripePriceEnv: plan.stripePriceEnv,
    displayPrice: plan.displayPrice ?? 0,
    version: plan.version ?? 1,
    updatedAt: plan.updatedAt || null,
    updatedBy: plan.updatedBy || null
  };
}

function mergeDefaultWithDoc(defaultPlan, doc) {
  const base = clonePlan(defaultPlan);
  if (!doc) return base;
  return {
    ...base,
    name: doc.name || base.name,
    limits: {
      ...base.limits,
      ...(doc.limits && typeof doc.limits === "object" ? doc.limits : {})
    },
    features: {
      ...base.features,
      ...(doc.features && typeof doc.features === "object" ? doc.features : {})
    },
    displayPrice:
      doc.displayPrice != null && !Number.isNaN(Number(doc.displayPrice))
        ? Number(doc.displayPrice)
        : base.displayPrice,
    version: doc.version ?? 1,
    updatedAt: doc.updatedAt || null,
    updatedBy: doc.updatedBy || null
  };
}

export async function ensurePlanDefinitionsSeeded() {
  const keys = Object.values(PLAN_KEYS);
  for (const key of keys) {
    const def = getDefaultPlanDefinition(key);
    const existing = await PlanDefinition.findOne({ key }).lean();
    if (existing) continue;
    await PlanDefinition.create({
      key: def.key,
      name: def.name,
      limits: { ...def.limits },
      features: { ...def.features },
      displayPrice: def.displayPrice ?? 0,
      version: 1
    });
  }
  invalidatePlanCatalogCache();
}

async function loadResolvedMap() {
  const now = Date.now();
  if (cache && now - cacheAt < CACHE_TTL_MS) return cache;

  await ensurePlanDefinitionsSeeded();
  const docs = await PlanDefinition.find({}).lean();
  const byKey = Object.fromEntries(docs.map((d) => [d.key, d]));
  const map = {};
  for (const key of Object.values(PLAN_KEYS)) {
    map[key] = mergeDefaultWithDoc(getDefaultPlanDefinition(key), byKey[key]);
  }
  cache = map;
  cacheAt = now;
  return map;
}

export async function getResolvedPlan(planKey) {
  if (!isValidPlanKey(planKey)) {
    throw new ApiError(400, `Unknown plan key: ${planKey}`);
  }
  const map = await loadResolvedMap();
  return map[planKey];
}

export async function listResolvedPlans() {
  const map = await loadResolvedMap();
  return Object.values(PLAN_KEYS).map((k) => map[k]);
}

export async function getCatalogDefaultsSnapshot() {
  return Object.values(DEFAULT_PLAN_CATALOG).map((p) => clonePlan(p));
}

function sanitizeLimits(input = {}) {
  const out = {};
  for (const key of Object.values(LIMIT_KEYS)) {
    if (input[key] === undefined) continue;
    const n = Number(input[key]);
    if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
      throw new ApiError(400, `Invalid limit for ${key}`);
    }
    if (key === LIMIT_KEYS.SEATS && n < 1) {
      throw new ApiError(400, "seats must be at least 1");
    }
    out[key] = n;
  }
  return out;
}

export async function updatePlanDefinition(planKey, patch, adminUserId) {
  if (!isValidPlanKey(planKey)) throw new ApiError(400, `Unknown plan key: ${planKey}`);
  await ensurePlanDefinitionsSeeded();

  const doc = await PlanDefinition.findOne({ key: planKey });
  if (!doc) throw new ApiError(404, "Plan definition not found");

  if (patch.name != null) {
    const name = String(patch.name).trim();
    if (name.length < 2 || name.length > 80) throw new ApiError(400, "Invalid plan name");
    doc.name = name;
  }

  if (patch.displayPrice != null) {
    const price = Number(patch.displayPrice);
    if (!Number.isFinite(price) || price < 0) throw new ApiError(400, "Invalid displayPrice");
    doc.displayPrice = price;
  }

  if (patch.limits) {
    const nextLimits = sanitizeLimits(patch.limits);
    const current =
      doc.limits && typeof doc.limits === "object" && !Array.isArray(doc.limits)
        ? { ...doc.limits }
        : {};
    doc.limits = { ...current, ...nextLimits };
    doc.markModified("limits");
  }

  if (patch.features) {
    const current =
      doc.features && typeof doc.features === "object" && !Array.isArray(doc.features)
        ? { ...doc.features }
        : {};
    if (patch.features[FEATURE_KEYS.CREATE_FIRM] !== undefined) {
      current[FEATURE_KEYS.CREATE_FIRM] = Boolean(patch.features[FEATURE_KEYS.CREATE_FIRM]);
    } else if (patch.features.create_firm !== undefined) {
      current[FEATURE_KEYS.CREATE_FIRM] = Boolean(patch.features.create_firm);
    }
    doc.features = current;
    doc.markModified("features");
  }

  doc.version = (doc.version || 1) + 1;
  doc.updatedBy = adminUserId || null;
  await doc.save();
  invalidatePlanCatalogCache();
  return getResolvedPlan(planKey);
}

export async function resetPlanDefinition(planKey, adminUserId) {
  if (!isValidPlanKey(planKey)) throw new ApiError(400, `Unknown plan key: ${planKey}`);
  const def = getDefaultPlanDefinition(planKey);
  await ensurePlanDefinitionsSeeded();

  const doc = await PlanDefinition.findOneAndUpdate(
    { key: planKey },
    {
      $set: {
        name: def.name,
        limits: { ...def.limits },
        features: { ...def.features },
        displayPrice: def.displayPrice ?? 0,
        updatedBy: adminUserId || null
      },
      $inc: { version: 1 }
    },
    { new: true, upsert: true }
  );

  invalidatePlanCatalogCache();
  return getResolvedPlan(doc.key);
}
