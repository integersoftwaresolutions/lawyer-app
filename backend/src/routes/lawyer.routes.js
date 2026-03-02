import { Router } from "express";
import { validate } from "../middlewares/validate.middleware.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/rbac.middleware.js";
import * as lawyerCtrl from "../controllers/lawyer.controller.js";
import { searchLawyersSchema } from "../validators/lawyer.validators.js";
import { bookingIdParamSchema, rescheduleBookingSchema } from "../validators/booking.validators.js";
import { uploadSingle } from "../middlewares/upload.middleware.js";

const r = Router();

r.get("/", validate(searchLawyersSchema), lawyerCtrl.search);
r.get("/me/profile", authMiddleware, requireRoles("LAWYER"), lawyerCtrl.getMyProfile);
r.put("/me/profile", authMiddleware, requireRoles("LAWYER"), lawyerCtrl.updateMyProfile);
r.get("/me/bookings", authMiddleware, requireRoles("LAWYER"), lawyerCtrl.getMyBookings);
r.patch("/me/bookings/:bookingId", authMiddleware, requireRoles("LAWYER"), validate(rescheduleBookingSchema), lawyerCtrl.rescheduleMyBooking);
r.delete("/me/bookings/:bookingId", authMiddleware, requireRoles("LAWYER"), validate(bookingIdParamSchema), lawyerCtrl.deleteMyBooking);
r.get("/me/stats", authMiddleware, requireRoles("LAWYER"), lawyerCtrl.getMyStats);
r.get("/me/earnings", authMiddleware, requireRoles("LAWYER"), lawyerCtrl.getMyEarnings);
r.get("/me/availability", authMiddleware, requireRoles("LAWYER"), lawyerCtrl.getMyAvailability);
r.put("/me/availability", authMiddleware, requireRoles("LAWYER"), lawyerCtrl.updateMyAvailability);
r.get("/me/reviews", authMiddleware, requireRoles("LAWYER"), lawyerCtrl.getMyReviews);
r.post("/me/verification/documents", authMiddleware, requireRoles("LAWYER"), uploadSingle, lawyerCtrl.uploadVerificationDocument);
r.get("/:lawyerUserId", lawyerCtrl.profile);
r.get("/:lawyerUserId/slots", lawyerCtrl.getAvailableSlots);
r.get("/:lawyerUserId/reviews", lawyerCtrl.getLawyerReviews);

export default r;
