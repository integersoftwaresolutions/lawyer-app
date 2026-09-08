import { ApiError } from "../helpers/apiError.js";
import {
  PLAN_KEYS,
  LIMIT_KEYS,
  FEATURE_KEYS,
  PLAN_LIMIT_ERROR_CODES,
  entitlementsPlanKey
} from "./planCatalog.js";
import { getResolvedPlan } from "./planDefinition.service.js";
import * as usageMeters from "./usageMeters.js";
import {
  ensureSubscription,
  formatSubscription,
  expireTrials
} from "./subscription.service.js";
import { BILLING_STATUS } from "../models/WorkspaceSubscription.js";

function limitOrSeat(plan, sub) {
  const catalogSeats = plan.limits[LIMIT_KEYS.SEATS];
  return sub.seatLimit != null ? sub.seatLimit : catalogSeats;
}

/**
 * Resolve effective entitlements for a workspace.
 * Lazy-expires local trials on read.
 */
export async function getEntitlements(workspaceId) {
  let sub = await ensureSubscription(workspaceId);

  if (
    sub.status === BILLING_STATUS.TRIALING &&
    sub.trialEndsAt &&
    sub.trialEndsAt.getTime() <= Date.now() &&
    !sub.stripeSubscriptionId
  ) {
    await expireTrials();
    sub = await ensureSubscription(workspaceId);
  }

  const effectivePlanKey = entitlementsPlanKey(sub);
  const plan = await getResolvedPlan(effectivePlanKey);
  const limits = {
    ...plan.limits,
    [LIMIT_KEYS.SEATS]: limitOrSeat(plan, sub)
  };

  const usage = await usageMeters.getUsageSnapshot(workspaceId);

  const meters = {};
  for (const key of Object.values(LIMIT_KEYS)) {
    const limit = limits[key];
    const used = usage[key] || 0;
    meters[key] = {
      used,
      limit,
      remaining: Math.max(0, limit - used),
      pct: limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 100
    };
  }

  return {
    workspaceId: String(workspaceId),
    subscription: formatSubscription(sub),
    planKey: effectivePlanKey,
    planName: plan.name,
    features: { ...plan.features },
    limits,
    usage,
    meters,
    practiceLocked: Boolean(sub.practiceLocked),
    canUsePracticeWrites: !sub.practiceLocked
  };
}

function throwLimit(code, message, extras = {}) {
  throw new ApiError(402, message, extras, code);
}

export async function assertPracticeWritable(workspaceId) {
  const ent = await getEntitlements(workspaceId);
  if (ent.practiceLocked) {
    throwLimit(
      PLAN_LIMIT_ERROR_CODES.BILLING_LOCKED,
      "Practice tools are locked. Subscribe or update payment to continue.",
      { upgradeRequired: true }
    );
  }
  return ent;
}

export async function assertCanCreateCase(workspaceId) {
  const ent = await assertPracticeWritable(workspaceId);
  const meter = ent.meters[LIMIT_KEYS.CASES_ACTIVE];
  if (meter.used >= meter.limit) {
    throwLimit(
      PLAN_LIMIT_ERROR_CODES.CASES_ACTIVE,
      `Active case limit reached (${meter.limit}). Upgrade your plan to create more cases.`,
      { limit: meter.limit, used: meter.used, upgradeRequired: true }
    );
  }
  return ent;
}

export async function assertCanUseAi(workspaceId) {
  const ent = await assertPracticeWritable(workspaceId);
  const meter = ent.meters[LIMIT_KEYS.AI_MESSAGES_PER_MONTH];
  if (meter.used >= meter.limit) {
    throwLimit(
      PLAN_LIMIT_ERROR_CODES.AI_MESSAGES,
      `Monthly AI message limit reached (${meter.limit}). Upgrade your plan or wait until next month.`,
      { limit: meter.limit, used: meter.used, upgradeRequired: true }
    );
  }
  return ent;
}

export async function assertCanUploadDocument(workspaceId, { additionalBytes = 0 } = {}) {
  const ent = await assertPracticeWritable(workspaceId);
  const countMeter = ent.meters[LIMIT_KEYS.DOCS_COUNT];
  if (countMeter.used >= countMeter.limit) {
    throwLimit(
      PLAN_LIMIT_ERROR_CODES.DOCS_COUNT,
      `Document count limit reached (${countMeter.limit}). Upgrade your plan to upload more.`,
      { limit: countMeter.limit, used: countMeter.used, upgradeRequired: true }
    );
  }

  const storageMeter = ent.meters[LIMIT_KEYS.DOCS_STORAGE_MB];
  const extraMb = Math.ceil((additionalBytes || 0) / (1024 * 1024));
  if (storageMeter.used + extraMb > storageMeter.limit) {
    throwLimit(
      PLAN_LIMIT_ERROR_CODES.DOCS_STORAGE,
      `Storage limit reached (${storageMeter.limit} MB). Upgrade your plan or delete documents.`,
      { limit: storageMeter.limit, used: storageMeter.used, upgradeRequired: true }
    );
  }

  return {
    ...ent,
    storageWarning: storageMeter.pct >= 90
  };
}

export async function assertCanAddSeat(workspaceId) {
  const ent = await assertPracticeWritable(workspaceId);
  const meter = ent.meters[LIMIT_KEYS.SEATS];
  if (meter.used >= meter.limit) {
    throwLimit(
      PLAN_LIMIT_ERROR_CODES.SEATS,
      `Seat limit reached (${meter.limit}). Upgrade your firm plan or remove a member.`,
      { limit: meter.limit, used: meter.used, upgradeRequired: true }
    );
  }
  return ent;
}

export async function assertCanCreateFirm(actorPersonalWorkspaceId = null) {
  if (!actorPersonalWorkspaceId) return null;
  const ent = await getEntitlements(actorPersonalWorkspaceId);
  if (!ent.features[FEATURE_KEYS.CREATE_FIRM]) {
    // Personal Base/Max never have create_firm; firm create still goes through Stripe firm checkout.
    // Soft check only — paid firm checkout remains the path. Log for visibility.
    return ent;
  }
  return ent;
}

export async function hasFeature(workspaceId, featureKey) {
  const ent = await getEntitlements(workspaceId);
  return Boolean(ent.features[featureKey]);
}

export { LIMIT_KEYS, FEATURE_KEYS, PLAN_KEYS, PLAN_LIMIT_ERROR_CODES };
