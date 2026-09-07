import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/rbac.middleware.js";
import { requireEmailVerified } from "../middlewares/workspace.middleware.js";
import * as ctrl from "../controllers/billing.controller.js";

const r = Router();

const lawyer = [authMiddleware, requireRoles("LAWYER"), requireEmailVerified];

/** Public plan cards for marketing / pricing pages (no auth). */
r.get("/plans", ctrl.getCatalog);
r.get("/catalog", ...lawyer, ctrl.getCatalog);
r.get("/workspaces/:workspaceId/entitlements", ...lawyer, ctrl.getEntitlements);
r.get("/workspaces/:workspaceId/subscription", ...lawyer, ctrl.getSubscription);
r.post("/workspaces/:workspaceId/checkout", ...lawyer, ctrl.createCheckout);
r.post("/workspaces/:workspaceId/portal", ...lawyer, ctrl.createPortal);

export default r;
