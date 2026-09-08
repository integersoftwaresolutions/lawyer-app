/**
 * One-time migration: free→base, pro→max, firm→firm; seed PlanDefinition docs.
 *
 * Usage: node src/seeders/migratePlanKeys.js
 */
import { connectMongo } from "../db/mongo.js";
import Workspace from "../models/Workspace.js";
import WorkspaceSubscription from "../models/WorkspaceSubscription.js";
import { ensurePlanDefinitionsSeeded } from "../billing/planDefinition.service.js";

const PLAN_MAP = {
  free: "base",
  pro: "max",
  firm: "firm",
  firm_max: "firm_max",
  base: "base",
  max: "max"
};

function mapPlanKey(key) {
  if (!key) return "base";
  return PLAN_MAP[String(key).toLowerCase()] || "base";
}

async function run() {
  await connectMongo();

  let subUpdated = 0;
  let wsUpdated = 0;

  const subs = await WorkspaceSubscription.find({}).select("_id planKey status");
  for (const sub of subs) {
    const next = mapPlanKey(sub.planKey);
    const set = { planKey: next };
    // Old Pro trial → keep TRIALING but Base entitlements
    if (sub.status === "TRIALING" && (sub.planKey === "pro" || next === "max")) {
      set.planKey = "base";
    }
    if (sub.planKey !== set.planKey) {
      await WorkspaceSubscription.updateOne({ _id: sub._id }, { $set: set });
      subUpdated += 1;
    }
  }

  const workspaces = await Workspace.find({}).select("_id planId");
  for (const ws of workspaces) {
    const next = mapPlanKey(ws.planId);
    if (ws.planId !== next) {
      await Workspace.updateOne({ _id: ws._id }, { $set: { planId: next } });
      wsUpdated += 1;
    }
  }

  await ensurePlanDefinitionsSeeded();

  console.log(`migratePlanKeys: subscriptions updated=${subUpdated}, workspaces updated=${wsUpdated}`);
  console.log("PlanDefinition seed ensured.");
  process.exit(0);
}

run().catch((err) => {
  console.error("migratePlanKeys failed:", err);
  process.exit(1);
});
