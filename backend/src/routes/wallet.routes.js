import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/rbac.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import * as walletCtrl from "../controllers/wallet.controller.js";
import { hideLedgerEntrySchema, topupSchema } from "../validators/wallet.validators.js";

const r = Router();

r.get("/me", authMiddleware, walletCtrl.getMine);
r.get("/ledger", authMiddleware, walletCtrl.ledger);
r.delete("/ledger/:entryId", authMiddleware, validate(hideLedgerEntrySchema), walletCtrl.hideLedgerEntry);
// Open self-serve minting is disabled; only admins may credit wallets until payments land.
r.post("/topup", authMiddleware, requireRoles("ADMIN"), validate(topupSchema), walletCtrl.topup);

export default r;
