import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/rbac.middleware.js";
import {
  requireEmailVerified,
  resolveActiveWorkspace,
  requirePermission
} from "../middlewares/workspace.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { uploadSingle } from "../middlewares/upload.middleware.js";
import * as ragCtrl from "../controllers/rag.controller.js";
import { PERMISSIONS } from "../workspaces/permissions.catalog.js";
import {
  ingestCaseLawSchema,
  listCaseLawSchema,
  caseLawIdParamSchema,
  ingestLegalDocumentSchema,
  listLegalDocumentsSchema,
  legalDocumentIdParamSchema
} from "../validators/rag.validators.js";

// ---------------------------------------------------------------------------
// Admin: case-law corpus management. Mounted at /admin/rag
// ---------------------------------------------------------------------------
export const adminRagRouter = Router();

const adminGuards = [authMiddleware, requireRoles("ADMIN")];

adminRagRouter.get(
  "/case-law",
  ...adminGuards,
  validate(listCaseLawSchema),
  ragCtrl.adminListCaseLaw
);

adminRagRouter.get(
  "/case-law/:caseLawId",
  ...adminGuards,
  validate(caseLawIdParamSchema),
  ragCtrl.adminGetCaseLaw
);

adminRagRouter.post(
  "/case-law",
  ...adminGuards,
  uploadSingle,
  validate(ingestCaseLawSchema),
  ragCtrl.adminIngestCaseLaw
);

adminRagRouter.delete(
  "/case-law/:caseLawId",
  ...adminGuards,
  validate(caseLawIdParamSchema),
  ragCtrl.adminDeleteCaseLaw
);

// ---------------------------------------------------------------------------
// Lawyer: workspace RAG documents. Mounted at /ai/documents
// ---------------------------------------------------------------------------
export const lawyerRagRouter = Router();

const lawyerGuards = [
  authMiddleware,
  requireRoles("LAWYER"),
  requireEmailVerified,
  resolveActiveWorkspace
];

lawyerRagRouter.get(
  "/",
  ...lawyerGuards,
  requirePermission(PERMISSIONS.DOCS_VIEW),
  validate(listLegalDocumentsSchema),
  ragCtrl.lawyerListDocuments
);

lawyerRagRouter.get(
  "/:documentId",
  ...lawyerGuards,
  requirePermission(PERMISSIONS.DOCS_VIEW),
  validate(legalDocumentIdParamSchema),
  ragCtrl.lawyerGetDocument
);

lawyerRagRouter.post(
  "/",
  ...lawyerGuards,
  requirePermission(PERMISSIONS.DOCS_UPLOAD),
  uploadSingle,
  validate(ingestLegalDocumentSchema),
  ragCtrl.lawyerIngestDocument
);

lawyerRagRouter.patch(
  "/:documentId/visibility",
  ...lawyerGuards,
  requirePermission(PERMISSIONS.DOCS_MANAGE_VISIBILITY),
  validate(legalDocumentIdParamSchema),
  ragCtrl.lawyerUpdateDocumentVisibility
);

lawyerRagRouter.delete(
  "/:documentId",
  ...lawyerGuards,
  requirePermission(PERMISSIONS.DOCS_DELETE),
  validate(legalDocumentIdParamSchema),
  ragCtrl.lawyerDeleteDocument
);
