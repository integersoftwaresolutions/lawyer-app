import { Router } from "express";
import authRoutes from "./auth.routes.js";
import lawyerRoutes from "./lawyer.routes.js";
import clientRoutes from "./client.routes.js";
import bookingRoutes from "./booking.routes.js";
import walletRoutes from "./wallet.routes.js";
import adminRoutes from "./admin.routes.js";
import { SPECIALIZATIONS, CITIES } from "../config/constants.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/lawyers", lawyerRoutes);
router.use("/clients", clientRoutes);
router.use("/bookings", bookingRoutes);
router.use("/wallet", walletRoutes);
router.use("/admin", adminRoutes);

router.get("/constants", (req, res) => {
  res.json({
    success: true,
    data: {
      specializations: SPECIALIZATIONS,
      cities: CITIES
    }
  });
});

export default router;
