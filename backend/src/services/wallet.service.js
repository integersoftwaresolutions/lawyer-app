import { ApiError } from "../helpers/apiError.js";
import Wallet from "../models/Wallet.js";
import LedgerEntry from "../models/LedgerEntry.js";
import { LEDGER_TYPES } from "../config/constants.js";
import { listResult } from "../utils/pagination.js";
import { parseListQuery } from "../utils/listQuery.js";

async function getWalletOrThrow(userId) {
  const wallet = await Wallet.findOne({ userId });
  if (!wallet) throw new ApiError(404, "Wallet not found");
  return wallet;
}

export async function getWallet(userId) {
  const wallet = await getWalletOrThrow(userId);
  return wallet.toObject();
}

export async function getLedger(userId, query = {}) {
  const { filter, sort, pagination } = parseListQuery(query, {
    defaults: { limit: 20, maxLimit: 100 },
    baseFilter: { userId, isHidden: { $ne: true } },
    filters: [{ key: "type", path: "type", type: "eq" }],
    sort: { default: { createdAt: -1 } }
  });

  const [items, total] = await Promise.all([
    LedgerEntry.find(filter).sort(sort).skip(pagination.skip).limit(pagination.limit).lean(),
    LedgerEntry.countDocuments(filter)
  ]);

  return listResult({ items, total, pagination });
}

export async function hideLedgerEntry(userId, entryId) {
  const entry = await LedgerEntry.findOne({ _id: entryId, userId });
  if (!entry) throw new ApiError(404, "Ledger entry not found");
  entry.isHidden = true;
  await entry.save();
  return { ok: true };
}

export async function topupCredits(userId, { amount, note }) {
  const wallet = await getWalletOrThrow(userId);
  wallet.balanceCredits += amount;
  await wallet.save();

  await LedgerEntry.create({
    userId,
    type: LEDGER_TYPES.TOPUP,
    amount,
    note: note || "Topup"
  });

  return wallet.toObject();
}

export async function spendCredits(userId, { amount, note, refId }) {
  const wallet = await getWalletOrThrow(userId);
  if (wallet.balanceCredits < amount) throw new ApiError(400, "Insufficient credits");

  wallet.balanceCredits -= amount;
  await wallet.save();

  await LedgerEntry.create({
    userId,
    type: LEDGER_TYPES.SPEND,
    amount: -Math.abs(amount),
    note: note || "Spend",
    refId: refId || null
  });

  return wallet.toObject();
}

export async function refundCredits(userId, { amount, note, refId }) {
  const wallet = await Wallet.findOne({ userId });
  if (!wallet) {
    const created = await Wallet.create({
      userId,
      balanceCredits: amount,
      monthlyCredits: 0
    });
    await LedgerEntry.create({
      userId,
      type: LEDGER_TYPES.REFUND,
      amount,
      note: note || "Refund",
      refId: refId || null
    });
    return created.toObject();
  }
  wallet.balanceCredits += amount;
  await wallet.save();
  await LedgerEntry.create({
    userId,
    type: LEDGER_TYPES.REFUND,
    amount,
    note: note || "Refund",
    refId: refId || null
  });
  return wallet.toObject();
}
