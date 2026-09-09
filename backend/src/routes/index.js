import { Router } from "express";
import authRoutes from "./auth.routes.js";
import lawyerRoutes from "./lawyer.routes.js";
import clientRoutes from "./client.routes.js";
import bookingRoutes from "./booking.routes.js";
import walletRoutes from "./wallet.routes.js";
import adminRoutes from "./admin.routes.js";
import aiRoutes from "./ai.routes.js";
import plannerRoutes from "./planner.routes.js";
import notificationsRoutes from "./notifications.routes.js";
import workspaceRoutes from "./workspace.routes.js";
import caseRoutes from "./case.routes.js";
import billingRoutes from "../billing/billing.routes.js";
import demoRequestRoutes from "./demoRequest.routes.js";
import featureRequestRoutes from "./featureRequest.routes.js";
import {
  SPECIALIZATIONS,
  CITIES,
  CASE_STATUS,
  CASE_PRIORITY,
  CASE_TYPES,
  CASE_VISIBILITY,
  PAKISTANI_COURTS
} from "../config/constants.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/demo-requests", demoRequestRoutes);
router.use("/feature-requests", featureRequestRoutes);
router.use("/workspaces", workspaceRoutes);
router.use("/cases", caseRoutes);
router.use("/billing", billingRoutes);
router.use("/lawyers", lawyerRoutes);
router.use("/clients", clientRoutes);
router.use("/bookings", bookingRoutes);
router.use("/wallet", walletRoutes);
router.use("/admin", adminRoutes);
router.use("/ai", aiRoutes);
router.use("/planner", plannerRoutes);
router.use("/notifications", notificationsRoutes);

router.get("/constants", (req, res) => {
  res.json({
    success: true,
    data: {
      specializations: SPECIALIZATIONS,
      cities: CITIES,
      caseStatuses: Object.values(CASE_STATUS),
      casePriorities: Object.values(CASE_PRIORITY),
      caseTypes: Object.values(CASE_TYPES),
      caseVisibilities: Object.values(CASE_VISIBILITY),
      courts: PAKISTANI_COURTS
    }
  });
});

export default router;
