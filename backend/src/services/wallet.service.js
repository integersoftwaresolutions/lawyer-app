import { ApiError } from "../helpers/apiError.js";
import Wallet from "../models/Wallet.js";
import LedgerEntry from "../models/LedgerEntry.js";
import { LEDGER_TYPES } from "../config/constants.js";

async function getWalletOrThrow(userId) {
  const wallet = await Wallet.findOne({ userId });
  if (!wallet) throw new ApiError(404, "Wallet not found");
  return wallet;
}

export async function getWallet(userId) {
  const wallet = await getWalletOrThrow(userId);
  return wallet.toObject();
}

export async function getLedger(userId, { type, page = 1, limit = 20 } = {}) {
  const p = Number(page) || 1;
  const l = Math.min(100, Number(limit) || 20);
  const skip = (p - 1) * l;

  const filter = { userId, isHidden: { $ne: true } };
  if (type) filter.type = type;

  const [items, total] = await Promise.all([
    LedgerEntry.find(filter).sort({ createdAt: -1 }).skip(skip).limit(l).lean(),
    LedgerEntry.countDocuments(filter)
  ]);

  return { items, meta: { page: p, limit: l, total, pages: Math.ceil(total / l) } };
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
