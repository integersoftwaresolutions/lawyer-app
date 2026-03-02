import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/rbac.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import * as bookingCtrl from "../controllers/booking.controller.js";
import { createBookingSchema } from "../validators/booking.validators.js";

const r = Router();

r.post("/", authMiddleware, requireRoles("CLIENT"), validate(createBookingSchema), bookingCtrl.create);
r.get("/:bookingId", authMiddleware, bookingCtrl.getBooking);
r.post("/:bookingId/activate", authMiddleware, bookingCtrl.activate);
r.post("/:bookingId/complete", authMiddleware, bookingCtrl.complete);
r.get("/:bookingId/session", authMiddleware, bookingCtrl.session);

export default r;
