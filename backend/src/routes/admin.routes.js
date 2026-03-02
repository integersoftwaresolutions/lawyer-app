import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/rbac.middleware.js";
import * as adminCtrl from "../controllers/admin.controller.js";

const r = Router();

r.use(authMiddleware, requireRoles("ADMIN"));

r.get("/analytics", adminCtrl.getAnalytics);
r.get("/users", adminCtrl.getAllUsers);
r.get("/bookings", adminCtrl.getAllBookings);

r.get("/lawyers", adminCtrl.allLawyers);
r.get("/lawyers/pending", adminCtrl.pendingLawyers);
r.post("/lawyers/:lawyerUserId/verify", adminCtrl.verifyLawyer);
r.get("/lawyers/:lawyerUserId/documents", adminCtrl.getVerificationDocs);
r.post("/documents/:documentId/review", adminCtrl.reviewDocument);

r.get("/settings", adminCtrl.getSettings);
r.put("/settings", adminCtrl.updateSettings);

export default r;
