import { sendSuccess, sendListSuccess } from "../helpers/response.helper.js";
import * as subscriptionService from "../billing/subscription.service.js";
import * as entitlementService from "../billing/entitlement.service.js";
import { stripeBillingProvider } from "../billing/providers/stripe.provider.js";
import { env } from "../config/env.js";
import { ApiError } from "../helpers/apiError.js";
import { getActiveMembership } from "../services/workspace.service.js";
import { hasPermission, PERMISSIONS } from "../workspaces/permissions.catalog.js";

async function requireBillingAccess(userId, workspaceId, { manage = false } = {}) {
  const ctx = await getActiveMembership(userId, workspaceId);
  if (!ctx) throw new ApiError(403, "Not a member of this workspace");
  const need = manage ? PERMISSIONS.BILLING_MANAGE : PERMISSIONS.BILLING_VIEW;
  if (!ctx.membership.isOwner && !hasPermission(ctx.permissions, need)) {
    // Owner always allowed; also allow BILLING_MANAGE to view
    if (manage) throw new ApiError(403, `Missing permission: ${need}`);
    if (
      !hasPermission(ctx.permissions, PERMISSIONS.BILLING_MANAGE) &&
      !hasPermission(ctx.permissions, PERMISSIONS.BILLING_VIEW)
    ) {
      throw new ApiError(403, "Missing permission: billing.view");
    }
  }
  return ctx;
}

export async function getCatalog(req, res, next) {
  try {
    const data = await subscriptionService.getCatalogPublic();
    return sendSuccess(res, { data });
  } catch (e) {
    next(e);
  }
}

export async function getEntitlements(req, res, next) {
  try {
    const { workspaceId } = req.params;
    await requireBillingAccess(req.user.id, workspaceId, { manage: false });
    const data = await entitlementService.getEntitlements(workspaceId);
    return sendSuccess(res, { data });
  } catch (e) {
    next(e);
  }
}

export async function getSubscription(req, res, next) {
  try {
    const { workspaceId } = req.params;
    await requireBillingAccess(req.user.id, workspaceId, { manage: false });
    const sub = await subscriptionService.ensureSubscription(workspaceId);
    const invoices = await subscriptionService.listInvoices(workspaceId, 20);
    return sendSuccess(res, {
      data: {
        subscription: subscriptionService.formatSubscription(sub),
        invoices
      }
    });
  } catch (e) {
    next(e);
  }
}

export async function createCheckout(req, res, next) {
  try {
    const { workspaceId } = req.params;
    await requireBillingAccess(req.user.id, workspaceId, { manage: true });
    const planKey = req.body.planKey;
    const base = env.appBaseUrl || env.clientOrigin;
    const successUrl =
      req.body.successUrl ||
      `${base}/lawyer/billing?checkout=success`;
    const cancelUrl =
      req.body.cancelUrl || `${base}/lawyer/billing?checkout=cancel`;

    const data = await subscriptionService.createUpgradeCheckout({
      workspaceId,
      planKey,
      actorUserId: req.user.id,
      successUrl,
      cancelUrl
    });
    return sendSuccess(res, { data });
  } catch (e) {
    next(e);
  }
}

export async function createPortal(req, res, next) {
  try {
    const { workspaceId } = req.params;
    await requireBillingAccess(req.user.id, workspaceId, { manage: true });
    const base = env.appBaseUrl || env.clientOrigin;
    const returnUrl = req.body.returnUrl || `${base}/lawyer/billing`;
    const data = await subscriptionService.createPortalSession({
      workspaceId,
      returnUrl
    });
    return sendSuccess(res, { data });
  } catch (e) {
    next(e);
  }
}

export async function stripeWebhook(req, res) {
  try {
    const signature = req.headers["stripe-signature"];
    const event = await stripeBillingProvider.constructWebhookEvent(req.body, signature);
    await subscriptionService.handleStripeWebhookEvent(event);
    return res.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
}

// —— Admin ——
export async function adminListSubscriptions(req, res, next) {
  try {
    const data = await subscriptionService.listSubscriptionsAdmin(req.query);
    return sendListSuccess(res, data);
  } catch (e) {
    next(e);
  }
}

export async function adminGetSubscription(req, res, next) {
  try {
    const data = await subscriptionService.getSubscriptionDetailAdmin(req.params.workspaceId);
    return sendSuccess(res, { data });
  } catch (e) {
    next(e);
  }
}

export async function adminGrant(req, res, next) {
  try {
    const data = await subscriptionService.adminGrantPlan({
      workspaceId: req.params.workspaceId,
      planKey: req.body.planKey,
      adminUserId: req.user.id,
      reason: req.body.reason || "",
      seatLimit: req.body.seatLimit ?? null,
      trialDaysExtend: req.body.trialDaysExtend ?? null
    });
    return sendSuccess(res, { data, message: "Plan updated" });
  } catch (e) {
    next(e);
  }
}

export async function adminForceFree(req, res, next) {
  try {
    const data = await subscriptionService.adminForceFree({
      workspaceId: req.params.workspaceId,
      adminUserId: req.user.id,
      reason: req.body.reason || "",
      practiceLocked: Boolean(req.body.practiceLocked)
    });
    return sendSuccess(res, { data, message: "Workspace set to Base (unpaid)" });
  } catch (e) {
    next(e);
  }
}

export async function adminReconcile(req, res, next) {
  try {
    const data = await subscriptionService.reconcileWorkspace(req.params.workspaceId);
    return sendSuccess(res, { data, message: "Reconciled" });
  } catch (e) {
    next(e);
  }
}

export async function adminCatalog(req, res, next) {
  try {
    const catalog = await subscriptionService.getCatalogPublic();
    const { getCatalogDefaultsSnapshot } = await import("../billing/planDefinition.service.js");
    const defaults = await getCatalogDefaultsSnapshot();
    return sendSuccess(res, {
      data: {
        ...catalog,
        defaults
      }
    });
  } catch (e) {
    next(e);
  }
}

export async function adminUpdatePlan(req, res, next) {
  try {
    const { updatePlanDefinition } = await import("../billing/planDefinition.service.js");
    const data = await updatePlanDefinition(req.params.planKey, req.body, req.user.id);
    return sendSuccess(res, { data, message: "Plan updated" });
  } catch (e) {
    next(e);
  }
}

export async function adminResetPlan(req, res, next) {
  try {
    const { resetPlanDefinition } = await import("../billing/planDefinition.service.js");
    const data = await resetPlanDefinition(req.params.planKey, req.user.id);
    return sendSuccess(res, { data, message: "Plan reset to defaults" });
  } catch (e) {
    next(e);
  }
}
