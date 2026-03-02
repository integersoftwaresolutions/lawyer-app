import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../helpers/response.helper.js";
import * as walletService from "../services/wallet.service.js";

export const getMine = asyncHandler(async (req, res) => {
  const out = await walletService.getWallet(req.user.id);
  return sendSuccess(res, { message: "Wallet", data: out });
});

export const topup = asyncHandler(async (req, res) => {
  const out = await walletService.topupCredits(req.user.id, req.body);
  return sendSuccess(res, { message: "Topped up", data: out });
});

export const ledger = asyncHandler(async (req, res) => {
  const out = await walletService.getLedger(req.user.id, req.query);
  return sendSuccess(res, { message: "Ledger", data: out.items, meta: out.meta });
});

export const hideLedgerEntry = asyncHandler(async (req, res) => {
  const out = await walletService.hideLedgerEntry(req.user.id, req.params.entryId);
  return sendSuccess(res, { message: "Ledger entry hidden", data: out });
});
