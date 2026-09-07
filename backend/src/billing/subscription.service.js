import { env } from "../config/env.js";
import { ApiError } from "../helpers/apiError.js";
import Workspace from "../models/Workspace.js";
import User from "../models/User.js";
import WorkspaceSubscription, {
  BILLING_STATUS,
  BILLING_PROVIDER
} from "../models/WorkspaceSubscription.js";
import BillingEvent from "../models/BillingEvent.js";
import BillingInvoice from "../models/BillingInvoice.js";
import {
  PLAN_KEYS,
  getPlanDefinition,
  listPlans,
  resolvePlanKeyFromPriceId,
  entitlementsPlanKey
} from "./planCatalog.js";
import {
  stripeBillingProvider,
  getPriceIdForPlan,
  getStripePriceMap,
  isStripeConfigured
} from "./providers/stripe.provider.js";
import { WORKSPACE_TYPES } from "../config/constants.js";

function trialDays() {
  return env.billingTrialDays || 14;
}

function graceDays() {
  return env.billingPastDueGraceDays || 3;
}

export function formatSubscription(doc) {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    id: o._id,
    workspaceId: o.workspaceId,
    planKey: o.planKey,
    status: o.status,
    provider: o.provider,
    stripeCustomerId: o.stripeCustomerId,
    stripeSubscriptionId: o.stripeSubscriptionId,
    stripePriceId: o.stripePriceId,
    seatLimit: o.seatLimit,
    trialEndsAt: o.trialEndsAt,
    currentPeriodStart: o.currentPeriodStart,
    currentPeriodEnd: o.currentPeriodEnd,
    cancelAtPeriodEnd: o.cancelAtPeriodEnd,
    canceledAt: o.canceledAt,
    graceEndsAt: o.graceEndsAt,
    practiceLocked: Boolean(o.practiceLocked),
    metadata: o.metadata || {},
    createdAt: o.createdAt,
    updatedAt: o.updatedAt
  };
}

export async function getSubscription(workspaceId) {
  return WorkspaceSubscription.findOne({ workspaceId });
}

export async function ensureSubscription(workspaceId, defaults = {}) {
  let sub = await WorkspaceSubscription.findOne({ workspaceId });
  if (sub) return sub;

  const planKey = defaults.planKey || PLAN_KEYS.FREE;
  const plan = getPlanDefinition(planKey);
  sub = await WorkspaceSubscription.create({
    workspaceId,
    planKey,
    status: defaults.status || BILLING_STATUS.FREE,
    provider: defaults.provider || BILLING_PROVIDER.NONE,
    seatLimit: defaults.seatLimit ?? plan.limits.seats ?? plan.limits["seats"],
    trialEndsAt: defaults.trialEndsAt || null,
    practiceLocked: false,
    metadata: defaults.metadata || {}
  });
  return sub;
}

export async function startPersonalTrial(workspaceId) {
  const plan = getPlanDefinition(PLAN_KEYS.PRO);
  const trialEndsAt = new Date(Date.now() + trialDays() * 24 * 60 * 60 * 1000);
  const existing = await WorkspaceSubscription.findOne({ workspaceId });
  if (existing) return existing;

  return WorkspaceSubscription.create({
    workspaceId,
    planKey: PLAN_KEYS.PRO,
    status: BILLING_STATUS.TRIALING,
    provider: BILLING_PROVIDER.NONE,
    seatLimit: plan.limits.seats,
    trialEndsAt,
    practiceLocked: false,
    metadata: { trialStartedAt: new Date().toISOString() }
  });
}

async function ensureStripeCustomer(sub, workspace) {
  if (sub.stripeCustomerId) return sub.stripeCustomerId;
  if (!isStripeConfigured()) {
    throw new ApiError(503, "Stripe is not configured");
  }

  const owner = await User.findById(workspace.ownerUserId).select("email fullName name").lean();
  const customer = await stripeBillingProvider.createCustomer({
    email: owner?.email || undefined,
    name: owner?.fullName || owner?.name || workspace.name,
    metadata: { workspaceId: String(workspace._id) }
  });

  sub.stripeCustomerId = customer.id;
  sub.provider = BILLING_PROVIDER.STRIPE;
  await sub.save();
  return customer.id;
}

export async function createUpgradeCheckout({
  workspaceId,
  planKey,
  actorUserId,
  successUrl,
  cancelUrl
}) {
  if (!isStripeConfigured()) {
    throw new ApiError(503, "Stripe is not configured. Set STRIPE_SECRET_KEY and price IDs.");
  }

  const workspace = await Workspace.findOne({ _id: workspaceId, deletedAt: null });
  if (!workspace) throw new ApiError(404, "Workspace not found");

  if (planKey === PLAN_KEYS.FIRM && workspace.type !== WORKSPACE_TYPES.FIRM) {
    throw new ApiError(400, "Firm plan is only for firm workspaces. Create a firm instead.");
  }
  if (planKey === PLAN_KEYS.PRO && workspace.type !== WORKSPACE_TYPES.PERSONAL) {
    throw new ApiError(400, "Pro plan is only for personal workspaces");
  }
  if (planKey === PLAN_KEYS.FREE) {
    throw new ApiError(400, "Cannot checkout Free plan");
  }

  const priceId = getPriceIdForPlan(planKey);
  if (!priceId) {
    throw new ApiError(503, `Stripe price not configured for plan: ${planKey}`);
  }

  const sub = await ensureSubscription(workspaceId);
  const customerId = await ensureStripeCustomer(sub, workspace);

  const session = await stripeBillingProvider.createCheckoutSession({
    customerId,
    priceId,
    successUrl,
    cancelUrl,
    clientReferenceId: String(workspaceId),
    metadata: {
      workspaceId: String(workspaceId),
      planKey,
      actorUserId: String(actorUserId),
      intent: "upgrade"
    }
  });

  return { checkoutUrl: session.url, sessionId: session.id };
}

/**
 * Pay-then-create firm: Checkout with firm payload in metadata; webhook creates workspace.
 */
export async function createFirmCheckout({
  actorUserId,
  firmPayload,
  successUrl,
  cancelUrl
}) {
  if (!isStripeConfigured()) {
    return null; // caller falls back to manual firm create
  }

  const priceId = getPriceIdForPlan(PLAN_KEYS.FIRM);
  if (!priceId) {
    throw new ApiError(503, "Stripe Firm price is not configured (STRIPE_PRICE_FIRM_MONTHLY)");
  }

  const user = await User.findById(actorUserId).select("email fullName name").lean();
  if (!user) throw new ApiError(404, "User not found");

  // Temporary customer without workspace — attach workspaceId after create in webhook
  const customer = await stripeBillingProvider.createCustomer({
    email: user.email,
    name: user.fullName || user.name || firmPayload.name,
    metadata: { pendingFirmOwnerId: String(actorUserId) }
  });

  const session = await stripeBillingProvider.createCheckoutSession({
    customerId: customer.id,
    priceId,
    successUrl,
    cancelUrl,
    clientReferenceId: String(actorUserId),
    metadata: {
      intent: "create_firm",
      actorUserId: String(actorUserId),
      planKey: PLAN_KEYS.FIRM,
      firmName: String(firmPayload.name || "").slice(0, 200),
      firmSlug: String(firmPayload.slug || "").slice(0, 80),
      firmCity: String(firmPayload.city || "").slice(0, 100),
      firmPayloadJson: JSON.stringify({
        address: firmPayload.address || "",
        phone: firmPayload.phone || "",
        website: firmPayload.website || "",
        practiceAreas: Array.isArray(firmPayload.practiceAreas) ? firmPayload.practiceAreas.slice(0, 20) : [],
        description: String(firmPayload.description || "").slice(0, 500)
      }).slice(0, 450)
    }
  });

  return { checkoutUrl: session.url, sessionId: session.id, stripeCustomerId: customer.id };
}

export async function createPortalSession({ workspaceId, returnUrl }) {
  if (!isStripeConfigured()) {
    throw new ApiError(503, "Stripe is not configured");
  }
  const workspace = await Workspace.findOne({ _id: workspaceId, deletedAt: null });
  if (!workspace) throw new ApiError(404, "Workspace not found");
  const sub = await ensureSubscription(workspaceId);
  const customerId = await ensureStripeCustomer(sub, workspace);
  const portal = await stripeBillingProvider.createPortalSession({ customerId, returnUrl });
  return { portalUrl: portal.url };
}

function mapStripeStatus(stripeStatus) {
  switch (stripeStatus) {
    case "active":
    case "trialing":
      return BILLING_STATUS.ACTIVE;
    case "past_due":
    case "unpaid":
      return BILLING_STATUS.PAST_DUE;
    case "canceled":
    case "incomplete_expired":
      return BILLING_STATUS.CANCELED;
    case "incomplete":
      return BILLING_STATUS.INCOMPLETE;
    default:
      return BILLING_STATUS.ACTIVE;
  }
}

function priceIdFromSubscription(stripeSub) {
  return stripeSub?.items?.data?.[0]?.price?.id || null;
}

export async function applyStripeSubscription(workspaceId, stripeSub, extras = {}) {
  const priceId = priceIdFromSubscription(stripeSub);
  const planKey =
    extras.planKey ||
    resolvePlanKeyFromPriceId(priceId, getStripePriceMap()) ||
    PLAN_KEYS.PRO;

  const plan = getPlanDefinition(planKey);
  let status = mapStripeStatus(stripeSub.status);

  // Local trials are separate; Stripe "trialing" maps to ACTIVE paid trial if used later
  if (stripeSub.status === "trialing" && !extras.keepLocalTrial) {
    status = BILLING_STATUS.ACTIVE;
  }

  const seatLimit = extras.seatLimitOverride ?? plan.limits.seats;
  const graceEndsAt =
    status === BILLING_STATUS.PAST_DUE
      ? extras.graceEndsAt ||
        new Date(Date.now() + graceDays() * 24 * 60 * 60 * 1000)
      : null;

  const practiceLocked =
    status === BILLING_STATUS.PAST_DUE &&
    graceEndsAt &&
    graceEndsAt.getTime() < Date.now();

  const sub = await ensureSubscription(workspaceId);
  sub.planKey = planKey;
  sub.status = status === BILLING_STATUS.CANCELED ? BILLING_STATUS.FREE : status;
  if (status === BILLING_STATUS.CANCELED) {
    sub.planKey = workspaceTypePlanFallback(await Workspace.findById(workspaceId).lean());
    sub.provider = BILLING_PROVIDER.STRIPE;
    sub.canceledAt = new Date();
    sub.stripeSubscriptionId = null;
    sub.practiceLocked = false;
    sub.graceEndsAt = null;
  } else {
    sub.provider = BILLING_PROVIDER.STRIPE;
    sub.stripeSubscriptionId = stripeSub.id;
    sub.stripePriceId = priceId;
    sub.seatLimit = seatLimit;
    sub.currentPeriodStart = stripeSub.current_period_start
      ? new Date(stripeSub.current_period_start * 1000)
      : null;
    sub.currentPeriodEnd = stripeSub.current_period_end
      ? new Date(stripeSub.current_period_end * 1000)
      : null;
    sub.cancelAtPeriodEnd = Boolean(stripeSub.cancel_at_period_end);
    sub.graceEndsAt = graceEndsAt;
    sub.practiceLocked = Boolean(practiceLocked);
    if (status === BILLING_STATUS.ACTIVE) {
      sub.trialEndsAt = null;
    }
  }

  if (extras.stripeCustomerId) sub.stripeCustomerId = extras.stripeCustomerId;
  await sub.save();

  await Workspace.updateOne(
    { _id: workspaceId },
    { $set: { planId: sub.planKey, seatLimit: sub.seatLimit } }
  );

  return sub;
}

function workspaceTypePlanFallback(ws) {
  return ws?.type === WORKSPACE_TYPES.FIRM ? PLAN_KEYS.FREE : PLAN_KEYS.FREE;
}

export async function upsertInvoiceFromStripe(workspaceId, invoice) {
  if (!invoice?.id || !workspaceId) return null;
  return BillingInvoice.findOneAndUpdate(
    { stripeInvoiceId: invoice.id },
    {
      $set: {
        workspaceId,
        number: invoice.number || "",
        status: invoice.status || "",
        amountDue: invoice.amount_due || 0,
        amountPaid: invoice.amount_paid || 0,
        currency: invoice.currency || "usd",
        hostedInvoiceUrl: invoice.hosted_invoice_url || "",
        pdfUrl: invoice.invoice_pdf || "",
        periodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
        periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
        paidAt: invoice.status_transitions?.paid_at
          ? new Date(invoice.status_transitions.paid_at * 1000)
          : null
      }
    },
    { upsert: true, new: true }
  );
}

async function markEventProcessed(event) {
  try {
    await BillingEvent.create({
      providerEventId: event.id,
      type: event.type,
      workspaceId: event.data?.object?.metadata?.workspaceId || null,
      summary: {
        objectId: event.data?.object?.id,
        customer: event.data?.object?.customer
      },
      processedAt: new Date()
    });
    return true;
  } catch (err) {
    if (err?.code === 11000) return false; // already processed
    throw err;
  }
}

export async function handleStripeWebhookEvent(event) {
  const firstTime = await markEventProcessed(event);
  if (!firstTime) return { duplicate: true };

  switch (event.type) {
    case "checkout.session.completed":
      await onCheckoutCompleted(event.data.object);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await onSubscriptionUpdated(event.data.object);
      break;
    case "customer.subscription.deleted":
      await onSubscriptionDeleted(event.data.object);
      break;
    case "invoice.paid":
    case "invoice.payment_failed":
    case "invoice.finalized":
      await onInvoiceEvent(event.data.object);
      break;
    default:
      break;
  }

  return { ok: true };
}

async function onCheckoutCompleted(session) {
  const intent = session.metadata?.intent;
  const planKey = session.metadata?.planKey;

  if (intent === "create_firm") {
    const { createFirmFromBillingCheckout } = await import("../services/workspace.service.js");
    await createFirmFromBillingCheckout({
      actorUserId: session.metadata.actorUserId,
      stripeCustomerId: session.customer,
      stripeSubscriptionId: session.subscription,
      planKey: PLAN_KEYS.FIRM,
      firm: {
        name: session.metadata.firmName,
        slug: session.metadata.firmSlug || undefined,
        city: session.metadata.firmCity || "",
        ...(safeJson(session.metadata.firmPayloadJson) || {})
      }
    });
    return;
  }

  const workspaceId = session.metadata?.workspaceId || session.client_reference_id;
  if (!workspaceId || !session.subscription) return;

  const stripeSub = await stripeBillingProvider.retrieveSubscription(session.subscription);
  if (!stripeSub) return;

  await applyStripeSubscription(workspaceId, stripeSub, {
    planKey,
    stripeCustomerId: session.customer
  });
}

function safeJson(s) {
  try {
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

async function findWorkspaceIdForStripeSub(stripeSub) {
  if (stripeSub.metadata?.workspaceId) return stripeSub.metadata.workspaceId;
  const bySub = await WorkspaceSubscription.findOne({
    stripeSubscriptionId: stripeSub.id
  }).lean();
  if (bySub) return String(bySub.workspaceId);
  if (stripeSub.customer) {
    const byCustomer = await WorkspaceSubscription.findOne({
      stripeCustomerId: stripeSub.customer
    }).lean();
    if (byCustomer) return String(byCustomer.workspaceId);
  }
  return null;
}

async function onSubscriptionUpdated(stripeSub) {
  const workspaceId = await findWorkspaceIdForStripeSub(stripeSub);
  if (!workspaceId) return;
  await applyStripeSubscription(workspaceId, stripeSub, {
    stripeCustomerId: stripeSub.customer
  });
}

async function onSubscriptionDeleted(stripeSub) {
  const workspaceId = await findWorkspaceIdForStripeSub(stripeSub);
  if (!workspaceId) return;
  const sub = await ensureSubscription(workspaceId);
  const ws = await Workspace.findById(workspaceId).lean();
  sub.planKey = PLAN_KEYS.FREE;
  sub.status = BILLING_STATUS.FREE;
  sub.stripeSubscriptionId = null;
  sub.cancelAtPeriodEnd = false;
  sub.canceledAt = new Date();
  sub.practiceLocked = ws?.type === WORKSPACE_TYPES.FIRM;
  sub.seatLimit = getPlanDefinition(PLAN_KEYS.FREE).limits.seats;
  await sub.save();
  await Workspace.updateOne(
    { _id: workspaceId },
    { $set: { planId: PLAN_KEYS.FREE, seatLimit: sub.seatLimit } }
  );
}

async function onInvoiceEvent(invoice) {
  let workspaceId = invoice.metadata?.workspaceId || null;
  if (!workspaceId && invoice.customer) {
    const sub = await WorkspaceSubscription.findOne({
      stripeCustomerId: invoice.customer
    }).lean();
    if (sub) workspaceId = String(sub.workspaceId);
  }
  if (!workspaceId) return;
  await upsertInvoiceFromStripe(workspaceId, invoice);

  if (invoice.subscription && invoice.paid) {
    const stripeSub = await stripeBillingProvider.retrieveSubscription(invoice.subscription);
    if (stripeSub) {
      await applyStripeSubscription(workspaceId, stripeSub, {
        stripeCustomerId: invoice.customer
      });
    }
  }

  if (invoice.subscription && eventFailed(invoice)) {
    const stripeSub = await stripeBillingProvider.retrieveSubscription(invoice.subscription);
    if (stripeSub) {
      await applyStripeSubscription(workspaceId, stripeSub, {
        stripeCustomerId: invoice.customer,
        graceEndsAt: new Date(Date.now() + graceDays() * 24 * 60 * 60 * 1000)
      });
    }
  }
}

function eventFailed(invoice) {
  return invoice.status === "open" || invoice.status === "uncollectible";
}

/** Expire local trials (not Stripe charges). */
export async function expireTrials() {
  const now = new Date();
  const due = await WorkspaceSubscription.find({
    status: BILLING_STATUS.TRIALING,
    trialEndsAt: { $lte: now }
  });

  let count = 0;
  for (const sub of due) {
    if (sub.stripeSubscriptionId) continue;
    sub.status = BILLING_STATUS.FREE;
    sub.planKey = PLAN_KEYS.FREE;
    sub.seatLimit = getPlanDefinition(PLAN_KEYS.FREE).limits.seats;
    sub.trialEndsAt = null;
    await sub.save();
    await Workspace.updateOne(
      { _id: sub.workspaceId },
      { $set: { planId: PLAN_KEYS.FREE, seatLimit: sub.seatLimit } }
    );
    count += 1;
  }
  return count;
}

/** Lock firm practice after past_due grace. */
export async function applyPastDueGraceLocks() {
  const now = new Date();
  const rows = await WorkspaceSubscription.find({
    status: BILLING_STATUS.PAST_DUE,
    practiceLocked: false,
    graceEndsAt: { $lte: now }
  });

  let count = 0;
  for (const sub of rows) {
    sub.practiceLocked = true;
    await sub.save();
    count += 1;
  }
  return count;
}

export async function reconcileWorkspace(workspaceId) {
  const sub = await ensureSubscription(workspaceId);
  if (!sub.stripeSubscriptionId || !isStripeConfigured()) {
    return formatSubscription(sub);
  }
  const stripeSub = await stripeBillingProvider.retrieveSubscription(sub.stripeSubscriptionId);
  if (!stripeSub) return formatSubscription(sub);
  const updated = await applyStripeSubscription(workspaceId, stripeSub, {
    stripeCustomerId: sub.stripeCustomerId
  });
  return formatSubscription(updated);
}

export async function reconcileActiveSubscriptions() {
  if (!env.billingReconcileEnabled || !isStripeConfigured()) return 0;
  const rows = await WorkspaceSubscription.find({
    status: { $in: [BILLING_STATUS.ACTIVE, BILLING_STATUS.PAST_DUE] },
    stripeSubscriptionId: { $ne: null }
  }).limit(200);

  let count = 0;
  for (const sub of rows) {
    try {
      await reconcileWorkspace(sub.workspaceId);
      count += 1;
    } catch (err) {
      console.error("Billing reconcile failed", sub.workspaceId, err.message);
    }
  }
  return count;
}

export async function adminGrantPlan({
  workspaceId,
  planKey,
  adminUserId,
  reason = "",
  seatLimit = null,
  trialDaysExtend = null
}) {
  const plan = getPlanDefinition(planKey);
  const sub = await ensureSubscription(workspaceId);

  if (trialDaysExtend != null) {
    sub.status = BILLING_STATUS.TRIALING;
    sub.planKey = PLAN_KEYS.PRO;
    sub.trialEndsAt = new Date(Date.now() + Number(trialDaysExtend) * 24 * 60 * 60 * 1000);
  } else {
    sub.planKey = planKey;
    sub.status = planKey === PLAN_KEYS.FREE ? BILLING_STATUS.FREE : BILLING_STATUS.ACTIVE;
    if (planKey === PLAN_KEYS.FREE) sub.trialEndsAt = null;
  }

  sub.provider = BILLING_PROVIDER.MANUAL;
  sub.seatLimit = seatLimit ?? plan.limits.seats;
  sub.practiceLocked = false;
  sub.graceEndsAt = null;
  sub.metadata = {
    ...(sub.metadata || {}),
    compReason: reason,
    adminUserId: String(adminUserId),
    grantedAt: new Date().toISOString()
  };
  await sub.save();

  await Workspace.updateOne(
    { _id: workspaceId },
    { $set: { planId: sub.planKey, seatLimit: sub.seatLimit } }
  );

  return formatSubscription(sub);
}

export async function adminForceFree({ workspaceId, adminUserId, reason = "" }) {
  return adminGrantPlan({
    workspaceId,
    planKey: PLAN_KEYS.FREE,
    adminUserId,
    reason
  });
}

export async function listSubscriptionsAdmin(query = {}) {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.planKey) filter.planKey = query.planKey;
  if (query.provider) filter.provider = query.provider;

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    WorkspaceSubscription.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
    WorkspaceSubscription.countDocuments(filter)
  ]);

  const wsIds = items.map((i) => i.workspaceId);
  const workspaces = await Workspace.find({ _id: { $in: wsIds } })
    .select("name type ownerUserId slug")
    .lean();
  const wsMap = Object.fromEntries(workspaces.map((w) => [String(w._id), w]));

  return {
    items: items.map((i) => ({
      ...formatSubscription(i),
      workspace: wsMap[String(i.workspaceId)]
        ? {
            id: wsMap[String(i.workspaceId)]._id,
            name: wsMap[String(i.workspaceId)].name,
            type: wsMap[String(i.workspaceId)].type,
            slug: wsMap[String(i.workspaceId)].slug,
            ownerUserId: wsMap[String(i.workspaceId)].ownerUserId
          }
        : null
    })),
    meta: { page, limit, total, pages: Math.ceil(total / limit) || 1 }
  };
}

export async function getSubscriptionDetailAdmin(workspaceId) {
  const sub = await ensureSubscription(workspaceId);
  const workspace = await Workspace.findById(workspaceId).lean();
  const invoices = await BillingInvoice.find({ workspaceId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  const events = await BillingEvent.find({ workspaceId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return {
    subscription: formatSubscription(sub),
    workspace: workspace
      ? {
          id: workspace._id,
          name: workspace.name,
          type: workspace.type,
          ownerUserId: workspace.ownerUserId
        }
      : null,
    invoices,
    events,
    catalogPlan: getPlanDefinition(entitlementsPlanKey(sub))
  };
}

export async function listInvoices(workspaceId, limit = 20) {
  return BillingInvoice.find({ workspaceId }).sort({ createdAt: -1 }).limit(limit).lean();
}

export function getCatalogPublic() {
  const displayPrices = {
    [PLAN_KEYS.FREE]: 0,
    [PLAN_KEYS.PRO]: Number(env.billingDisplayPricePro ?? 29),
    [PLAN_KEYS.FIRM]: Number(env.billingDisplayPriceFirm ?? 99)
  };
  const currency = (env.billingDisplayCurrency || "usd").toLowerCase();

  return {
    plans: listPlans().map((p) => ({
      key: p.key,
      name: p.name,
      workspaceTypes: p.workspaceTypes,
      limits: p.limits,
      features: p.features,
      stripePriceConfigured: Boolean(getPriceIdForPlan(p.key)),
      displayPriceMonthly: displayPrices[p.key] ?? null,
      currency
    })),
    stripeConfigured: isStripeConfigured(),
    priceEnvKeys: {
      [PLAN_KEYS.PRO]: "STRIPE_PRICE_PRO_MONTHLY",
      [PLAN_KEYS.FIRM]: "STRIPE_PRICE_FIRM_MONTHLY"
    }
  };
}

export { entitlementsPlanKey, BILLING_STATUS, PLAN_KEYS };
