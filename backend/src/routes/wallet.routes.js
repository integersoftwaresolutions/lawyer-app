import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import * as walletCtrl from "../controllers/wallet.controller.js";
import { hideLedgerEntrySchema, topupSchema } from "../validators/wallet.validators.js";

const r = Router();

r.get("/me", authMiddleware, walletCtrl.getMine);
r.get("/ledger", authMiddleware, walletCtrl.ledger);
r.delete("/ledger/:entryId", authMiddleware, validate(hideLedgerEntrySchema), walletCtrl.hideLedgerEntry);
r.post("/topup", authMiddleware, validate(topupSchema), walletCtrl.topup);

export default r;
