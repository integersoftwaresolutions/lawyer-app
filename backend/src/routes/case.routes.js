import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/rbac.middleware.js";
import {
  requireEmailVerified,
  resolveActiveWorkspace,
  requirePermission
} from "../middlewares/workspace.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { PERMISSIONS } from "../workspaces/permissions.catalog.js";
import * as caseCtrl from "../controllers/case.controller.js";
import {
  listCasesSchema,
  caseIdParamSchema,
  createCaseSchema,
  updateCaseSchema,
  assignCaseSchema,
  statusCaseSchema,
  noteBodySchema,
  noteIdParamSchema,
  updateNoteSchema,
  attachDocumentSchema,
  detachDocumentSchema,
  linkBookingSchema,
  listCaseDocumentsSchema
} from "../validators/case.validators.js";

const r = Router();

const guards = [
  authMiddleware,
  requireRoles("LAWYER"),
  requireEmailVerified,
  resolveActiveWorkspace
];

r.get("/meta", ...guards, requirePermission(PERMISSIONS.CASES_VIEW), caseCtrl.getCaseMeta);

r.get(
  "/",
  ...guards,
  requirePermission(PERMISSIONS.CASES_VIEW),
  validate(listCasesSchema),
  caseCtrl.listCases
);

r.post(
  "/",
  ...guards,
  requirePermission(PERMISSIONS.CASES_CREATE),
  validate(createCaseSchema),
  caseCtrl.createCase
);

r.get(
  "/:caseId",
  ...guards,
  requirePermission(PERMISSIONS.CASES_VIEW),
  validate(caseIdParamSchema),
  caseCtrl.getCase
);

r.patch(
  "/:caseId",
  ...guards,
  requirePermission(PERMISSIONS.CASES_EDIT),
  validate(updateCaseSchema),
  caseCtrl.updateCase
);

r.post(
  "/:caseId/assign",
  ...guards,
  requirePermission(PERMISSIONS.CASES_ASSIGN),
  validate(assignCaseSchema),
  caseCtrl.assignCase
);

r.post(
  "/:caseId/status",
  ...guards,
  requirePermission(PERMISSIONS.CASES_EDIT),
  validate(statusCaseSchema),
  caseCtrl.changeCaseStatus
);

r.post(
  "/:caseId/archive",
  ...guards,
  requirePermission(PERMISSIONS.CASES_ARCHIVE),
  validate(caseIdParamSchema),
  caseCtrl.archiveCase
);

r.post(
  "/:caseId/restore",
  ...guards,
  requirePermission(PERMISSIONS.CASES_ARCHIVE),
  validate(caseIdParamSchema),
  caseCtrl.restoreCase
);

r.delete(
  "/:caseId",
  ...guards,
  requirePermission(PERMISSIONS.CASES_DELETE),
  validate(caseIdParamSchema),
  caseCtrl.deleteCase
);

r.post(
  "/:caseId/notes",
  ...guards,
  requirePermission(PERMISSIONS.CASES_EDIT),
  validate(noteBodySchema),
  caseCtrl.addNote
);

r.patch(
  "/:caseId/notes/:noteId",
  ...guards,
  requirePermission(PERMISSIONS.CASES_EDIT),
  validate(updateNoteSchema),
  caseCtrl.updateNote
);

r.delete(
  "/:caseId/notes/:noteId",
  ...guards,
  requirePermission(PERMISSIONS.CASES_EDIT),
  validate(noteIdParamSchema),
  caseCtrl.deleteNote
);

r.get(
  "/:caseId/documents",
  ...guards,
  requirePermission(PERMISSIONS.CASES_VIEW),
  validate(listCaseDocumentsSchema),
  caseCtrl.listCaseDocuments
);

r.post(
  "/:caseId/documents",
  ...guards,
  requirePermission(PERMISSIONS.CASES_EDIT),
  validate(attachDocumentSchema),
  caseCtrl.attachDocument
);

r.delete(
  "/:caseId/documents/:documentId",
  ...guards,
  requirePermission(PERMISSIONS.CASES_EDIT),
  validate(detachDocumentSchema),
  caseCtrl.detachDocument
);

r.post(
  "/:caseId/booking",
  ...guards,
  requirePermission(PERMISSIONS.CASES_EDIT),
  validate(linkBookingSchema),
  caseCtrl.linkBooking
);

export default r;
