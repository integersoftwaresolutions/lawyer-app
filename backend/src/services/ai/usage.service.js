import AiUsageLog from "../../models/AiUsageLog.js";
import AdminSetting from "../../models/AdminSetting.js";
import { aiConfig } from "../../config/ai.config.js";
import { computeBillableUnits, estimateCostUsd } from "../../utils/aiCost.js";

async function getAdminSettings() {
  let settings = await AdminSetting.findOne();
  if (!settings) settings = await AdminSetting.create({});
  return settings;
}

function resolvePeriodRange(period = "month") {
  const now = new Date();
  const start = new Date(now);

  if (period === "day") {
    start.setHours(0, 0, 0, 0);
  } else if (period === "week") {
    start.setDate(now.getDate() - 7);
  } else {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }

  return { start, end: now };
}

export async function record({
  userId,
  sessionId = null,
  messageId = null,
  type,
  mode = null,
  model,
  promptTokens = 0,
  completionTokens = 0,
  totalTokens = 0,
  metadata = {}
}) {
  const tokens = totalTokens || promptTokens + completionTokens;
  const estimatedCostUsd = estimateCostUsd(model, { promptTokens, completionTokens });
  const billableUnits = computeBillableUnits(tokens, aiConfig.billableUnitsPerThousandTokens);

  const entry = await AiUsageLog.create({
    userId,
    sessionId,
    messageId,
    type,
    mode,
    model,
    promptTokens,
    completionTokens,
    totalTokens: tokens,
    estimatedCostUsd,
    billableUnits,
    billed: false,
    metadata
  });

  // Future billing hook — no-op until AdminSetting.aiBillingEnabled is true
  const settings = await getAdminSettings();
  if (settings.aiBillingEnabled) {
    // Part 13+ will wire walletService.deductCredits here
  }

  return entry;
}

export async function getSummary(userId, period = "month") {
  const { start, end } = resolvePeriodRange(period);

  const [aggregates] = await AiUsageLog.aggregate([
    {
      $match: {
        userId,
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: null,
        requestCount: { $sum: 1 },
        promptTokens: { $sum: "$promptTokens" },
        completionTokens: { $sum: "$completionTokens" },
        totalTokens: { $sum: "$totalTokens" },
        estimatedCostUsd: { $sum: "$estimatedCostUsd" },
        billableUnits: { $sum: "$billableUnits" }
      }
    }
  ]);

  const byType = await AiUsageLog.aggregate([
    {
      $match: {
        userId,
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: "$type",
        count: { $sum: 1 },
        totalTokens: { $sum: "$totalTokens" }
      }
    }
  ]);

  return {
    period,
    from: start,
    to: end,
    requestCount: aggregates?.requestCount ?? 0,
    promptTokens: aggregates?.promptTokens ?? 0,
    completionTokens: aggregates?.completionTokens ?? 0,
    totalTokens: aggregates?.totalTokens ?? 0,
    estimatedCostUsd: aggregates?.estimatedCostUsd ?? 0,
    billableUnits: aggregates?.billableUnits ?? 0,
    byType: byType.map((row) => ({
      type: row._id,
      count: row.count,
      totalTokens: row.totalTokens
    }))
  };
}

export async function countTodayRequests(userId) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  return AiUsageLog.countDocuments({
    userId,
    createdAt: { $gte: start }
  });
}

export async function getDailyLimit() {
  const settings = await getAdminSettings();
  return settings.aiDailyRequestLimit ?? aiConfig.dailyRequestLimit;
}
