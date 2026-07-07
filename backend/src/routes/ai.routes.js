import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/rbac.middleware.js";
import { requireVerifiedLawyer } from "../middlewares/lawyerVerification.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import * as aiCtrl from "../controllers/ai.controller.js";
import { lawyerRagRouter } from "./rag.routes.js";
import {
  createSessionSchema,
  listSessionsSchema,
  sessionIdParamSchema,
  sendMessageSchema,
  usageSummarySchema,
  updateSessionMetadataSchema
} from "../validators/ai.validators.js";

const r = Router();

const lawyerAi = [authMiddleware, requireRoles("LAWYER"), requireVerifiedLawyer];

r.get("/health", ...lawyerAi, aiCtrl.health);
r.get("/config", ...lawyerAi, aiCtrl.config);
r.get("/usage/summary", ...lawyerAi, validate(usageSummarySchema), aiCtrl.usageSummary);

r.post("/sessions", ...lawyerAi, validate(createSessionSchema), aiCtrl.createSession);
r.get("/sessions", ...lawyerAi, validate(listSessionsSchema), aiCtrl.listSessions);
r.get("/sessions/:sessionId", ...lawyerAi, validate(sessionIdParamSchema), aiCtrl.getSession);
r.post("/sessions/:sessionId/messages", ...lawyerAi, validate(sendMessageSchema), aiCtrl.sendMessage);
r.patch("/sessions/:sessionId", ...lawyerAi, validate(updateSessionMetadataSchema), aiCtrl.updateSession);
r.delete("/sessions/:sessionId", ...lawyerAi, validate(sessionIdParamSchema), aiCtrl.deleteSession);

// Cross-Examination prep report
r.get(
  "/sessions/:sessionId/report",
  ...lawyerAi,
  validate(sessionIdParamSchema),
  aiCtrl.generatePrepReport
);
r.get(
  "/sessions/:sessionId/report.pdf",
  ...lawyerAi,
  validate(sessionIdParamSchema),
  aiCtrl.downloadPrepReport
);

// Lawyer-private RAG documents
r.use("/documents", lawyerRagRouter);

export default r;
