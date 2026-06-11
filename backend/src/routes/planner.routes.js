import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/rbac.middleware.js";
import { requireVerifiedLawyer } from "../middlewares/lawyerVerification.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import * as plannerCtrl from "../controllers/planner.controller.js";
import {
  createEventSchema,
  updateEventSchema,
  eventIdParamSchema,
  listEventsSchema,
  conflictCheckSchema,
  todayEventsSchema
} from "../validators/planner.validators.js";

const r = Router();

const lawyerPlanner = [authMiddleware, requireRoles("LAWYER"), requireVerifiedLawyer];

r.get("/health", ...lawyerPlanner, plannerCtrl.health);

r.post("/events", ...lawyerPlanner, validate(createEventSchema), plannerCtrl.createEvent);
r.get("/events", ...lawyerPlanner, validate(listEventsSchema), plannerCtrl.listEvents);
r.get("/events/today", ...lawyerPlanner, validate(todayEventsSchema), plannerCtrl.getTodayEvents);
r.get("/events/conflicts", ...lawyerPlanner, validate(conflictCheckSchema), plannerCtrl.getConflicts);
r.get("/events/:eventId", ...lawyerPlanner, validate(eventIdParamSchema), plannerCtrl.getEvent);
r.patch("/events/:eventId", ...lawyerPlanner, validate(updateEventSchema), plannerCtrl.updateEvent);
r.delete("/events/:eventId", ...lawyerPlanner, validate(eventIdParamSchema), plannerCtrl.deleteEvent);

export default r;
