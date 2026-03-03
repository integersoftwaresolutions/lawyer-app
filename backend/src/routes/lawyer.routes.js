import { Router } from "express";
import { validate } from "../middlewares/validate.middleware.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/rbac.middleware.js";
import { requireVerifiedLawyer } from "../middlewares/lawyerVerification.middleware.js";
import * as lawyerCtrl from "../controllers/lawyer.controller.js";
import { searchLawyersSchema } from "../validators/lawyer.validators.js";
import { bookingIdParamSchema, rescheduleBookingSchema } from "../validators/booking.validators.js";
import { uploadSingle } from "../middlewares/upload.middleware.js";

const r = Router();

r.get("/", validate(searchLawyersSchema), lawyerCtrl.search);
r.get("/me/profile", authMiddleware, requireRoles("LAWYER"), lawyerCtrl.getMyProfile);
r.put("/me/profile", authMiddleware, requireRoles("LAWYER"), lawyerCtrl.updateMyProfile);
// Verification routes (no verification required)
r.get("/me/verification/status", authMiddleware, requireRoles("LAWYER"), lawyerCtrl.getVerificationStatus);
r.post("/me/verification/documents", authMiddleware, requireRoles("LAWYER"), uploadSingle, lawyerCtrl.uploadVerificationDocument);

// Routes that require verified lawyer
r.get("/me/bookings", authMiddleware, requireRoles("LAWYER"), requireVerifiedLawyer, lawyerCtrl.getMyBookings);
r.patch("/me/bookings/:bookingId", authMiddleware, requireRoles("LAWYER"), requireVerifiedLawyer, validate(rescheduleBookingSchema), lawyerCtrl.rescheduleMyBooking);
r.delete("/me/bookings/:bookingId", authMiddleware, requireRoles("LAWYER"), requireVerifiedLawyer, validate(bookingIdParamSchema), lawyerCtrl.deleteMyBooking);
r.get("/me/stats", authMiddleware, requireRoles("LAWYER"), requireVerifiedLawyer, lawyerCtrl.getMyStats);
r.get("/me/earnings", authMiddleware, requireRoles("LAWYER"), requireVerifiedLawyer, lawyerCtrl.getMyEarnings);
r.get("/me/availability", authMiddleware, requireRoles("LAWYER"), requireVerifiedLawyer, lawyerCtrl.getMyAvailability);
r.put("/me/availability", authMiddleware, requireRoles("LAWYER"), requireVerifiedLawyer, lawyerCtrl.updateMyAvailability);
r.get("/me/reviews", authMiddleware, requireRoles("LAWYER"), requireVerifiedLawyer, lawyerCtrl.getMyReviews);
r.get("/:lawyerUserId", lawyerCtrl.profile);
r.get("/:lawyerUserId/slots", lawyerCtrl.getAvailableSlots);
r.get("/:lawyerUserId/reviews", lawyerCtrl.getLawyerReviews);

export default r;
