import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/rbac.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import * as adminCtrl from "../controllers/admin.controller.js";
import { resolveDisputeSchema, updateDisputeStatusSchema } from "../validators/dispute.validators.js";
import { adminRagRouter } from "./rag.routes.js";
import * as billingCtrl from "../controllers/billing.controller.js";

const r = Router();

r.use("/rag", adminRagRouter);

r.use(authMiddleware, requireRoles("ADMIN"));

r.get("/workspaces", adminCtrl.listWorkspaces);
r.get("/analytics", adminCtrl.getAnalytics);
r.get("/users", adminCtrl.getAllUsers);
r.get("/bookings", adminCtrl.getAllBookings);

r.get("/lawyers", adminCtrl.allLawyers);
r.get("/lawyers/pending", adminCtrl.pendingLawyers);
r.get("/lawyers/:lawyerUserId/verification", adminCtrl.getLawyerVerificationStatus);
r.post("/lawyers/:lawyerUserId/verify", adminCtrl.verifyLawyer);
r.get("/lawyers/:lawyerUserId/documents", adminCtrl.getVerificationDocs);
r.post("/documents/:documentId/review", adminCtrl.reviewDocument);

r.get("/settings", adminCtrl.getSettings);
r.put("/settings", adminCtrl.updateSettings);

r.get("/disputes", adminCtrl.getDisputes);
r.get("/disputes/:disputeId", adminCtrl.getDisputeById);
r.patch("/disputes/:disputeId/status", validate(updateDisputeStatusSchema), adminCtrl.updateDisputeStatus);
r.post("/disputes/:disputeId/resolve", validate(resolveDisputeSchema), adminCtrl.resolveDispute);

r.get("/billing/catalog", billingCtrl.adminCatalog);
r.patch("/billing/catalog/:planKey", billingCtrl.adminUpdatePlan);
r.post("/billing/catalog/:planKey/reset", billingCtrl.adminResetPlan);
r.get("/billing/subscriptions", billingCtrl.adminListSubscriptions);
r.get("/billing/subscriptions/:workspaceId", billingCtrl.adminGetSubscription);
r.post("/billing/subscriptions/:workspaceId/grant", billingCtrl.adminGrant);
r.post("/billing/subscriptions/:workspaceId/force-free", billingCtrl.adminForceFree);
r.post("/billing/subscriptions/:workspaceId/reconcile", billingCtrl.adminReconcile);

export default r;
