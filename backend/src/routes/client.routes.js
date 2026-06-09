import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/rbac.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import * as clientCtrl from "../controllers/client.controller.js";
import { rescheduleBookingSchema } from "../validators/booking.validators.js";
import { raiseDisputeSchema } from "../validators/dispute.validators.js";

const r = Router();

r.use(authMiddleware, requireRoles("CLIENT"));

r.get("/me/profile", clientCtrl.getMyProfile);
r.put("/me/profile", clientCtrl.updateMyProfile);
r.get("/me/bookings", clientCtrl.getMyBookings);
r.patch("/me/bookings/:bookingId", validate(rescheduleBookingSchema), clientCtrl.rescheduleMyBooking);
r.delete("/me/bookings/:bookingId", clientCtrl.deleteMyBooking);
r.get("/me/stats", clientCtrl.getMyStats);
r.post("/me/reviews", clientCtrl.createReview);
r.get("/me/reviews", clientCtrl.getMyReviews);
r.post("/me/bookings/:bookingId/dispute", validate(raiseDisputeSchema), clientCtrl.raiseDispute);
r.get("/me/disputes", clientCtrl.getMyDisputes);

export default r;
