import {
  expireTrials,
  applyPastDueGraceLocks,
  reconcileActiveSubscriptions
} from "../billing/subscription.service.js";
import { env } from "../config/env.js";

let timer = null;
let running = false;

export async function processBillingJobs() {
  if (running) return;
  running = true;
  try {
    const expired = await expireTrials();
    const locked = await applyPastDueGraceLocks();
    const reconciled = await reconcileActiveSubscriptions();
    if (expired || locked || reconciled) {
      console.log(
        `[billing] trialsExpired=${expired} graceLocked=${locked} reconciled=${reconciled}`
      );
    }
  } catch (err) {
    console.error("[billing] job error:", err.message);
  } finally {
    running = false;
  }
}

export function startBillingJob() {
  if (timer) return;
  const interval = env.billingJobIntervalMs || 60 * 60 * 1000;
  // Run once shortly after boot, then on interval
  setTimeout(() => processBillingJobs(), 15_000);
  timer = setInterval(processBillingJobs, interval);
  if (typeof timer.unref === "function") timer.unref();
  console.log(`✅ Billing job scheduled every ${interval}ms`);
}
