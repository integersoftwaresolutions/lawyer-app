import { env } from "../../config/env.js";
import { PLAN_KEYS } from "../planCatalog.js";

let stripeClient = null;
let StripeCtor = null;

export function isStripeConfigured() {
  return Boolean(env.stripeSecretKey);
}

export function getStripePriceMap() {
  return {
    [PLAN_KEYS.BASE]: env.stripePriceBaseMonthly || null,
    [PLAN_KEYS.MAX]: env.stripePriceMaxMonthly || env.stripePriceProMonthly || null,
    [PLAN_KEYS.FIRM]: env.stripePriceFirmMonthly || null,
    [PLAN_KEYS.FIRM_MAX]: env.stripePriceFirmMaxMonthly || null
  };
}

export function getPriceIdForPlan(planKey) {
  return getStripePriceMap()[planKey] || null;
}

async function loadStripe() {
  if (!StripeCtor) {
    const mod = await import("stripe");
    StripeCtor = mod.default;
  }
  return StripeCtor;
}

export async function getStripeClientAsync() {
  if (!isStripeConfigured()) return null;
  if (!stripeClient) {
    const Stripe = await loadStripe();
    stripeClient = new Stripe(env.stripeSecretKey);
  }
  return stripeClient;
}

export const stripeBillingProvider = {
  isConfigured: isStripeConfigured,

  async createCustomer({ email, name, metadata = {} }) {
    const stripe = await getStripeClientAsync();
    if (!stripe) throw new Error("Stripe is not configured");
    return stripe.customers.create({
      email,
      name: name || undefined,
      metadata
    });
  },

  async createCheckoutSession({
    customerId,
    priceId,
    successUrl,
    cancelUrl,
    metadata = {},
    mode = "subscription",
    clientReferenceId = null
  }) {
    const stripe = await getStripeClientAsync();
    if (!stripe) throw new Error("Stripe is not configured");
    // No trial_period_days — Base trial is app-local only
    return stripe.checkout.sessions.create({
      mode,
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: clientReferenceId || undefined,
      metadata,
      subscription_data: { metadata },
      allow_promotion_codes: true
    });
  },

  async createPortalSession({ customerId, returnUrl }) {
    const stripe = await getStripeClientAsync();
    if (!stripe) throw new Error("Stripe is not configured");
    return stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl
    });
  },

  async retrieveSubscription(subscriptionId) {
    const stripe = await getStripeClientAsync();
    if (!stripe) return null;
    return stripe.subscriptions.retrieve(subscriptionId);
  },

  async listInvoices(customerId, limit = 20) {
    const stripe = await getStripeClientAsync();
    if (!stripe) return [];
    const res = await stripe.invoices.list({ customer: customerId, limit });
    return res.data || [];
  },

  async constructWebhookEvent(rawBody, signature) {
    const stripe = await getStripeClientAsync();
    if (!stripe) throw new Error("Stripe is not configured");
    if (!env.stripeWebhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");
    return stripe.webhooks.constructEvent(rawBody, signature, env.stripeWebhookSecret);
  },

  async cancelSubscription(subscriptionId, { atPeriodEnd = true } = {}) {
    const stripe = await getStripeClientAsync();
    if (!stripe) throw new Error("Stripe is not configured");
    if (atPeriodEnd) {
      return stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
    }
    return stripe.subscriptions.cancel(subscriptionId);
  }
};
