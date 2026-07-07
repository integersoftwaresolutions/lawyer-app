import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/rbac.middleware.js";
import { requireVerifiedLawyer } from "../middlewares/lawyerVerification.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { uploadSingle } from "../middlewares/upload.middleware.js";
import * as ragCtrl from "../controllers/rag.controller.js";
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

// `multipart/form-data` body parsing happens in upload middleware before validation.
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
// Lawyer: private RAG document management. Mounted at /ai/documents
// ---------------------------------------------------------------------------
export const lawyerRagRouter = Router();

const lawyerGuards = [authMiddleware, requireRoles("LAWYER"), requireVerifiedLawyer];

lawyerRagRouter.get(
  "/",
  ...lawyerGuards,
  validate(listLegalDocumentsSchema),
  ragCtrl.lawyerListDocuments
);

lawyerRagRouter.get(
  "/:documentId",
  ...lawyerGuards,
  validate(legalDocumentIdParamSchema),
  ragCtrl.lawyerGetDocument
);

lawyerRagRouter.post(
  "/",
  ...lawyerGuards,
  uploadSingle,
  validate(ingestLegalDocumentSchema),
  ragCtrl.lawyerIngestDocument
);

lawyerRagRouter.delete(
  "/:documentId",
  ...lawyerGuards,
  validate(legalDocumentIdParamSchema),
  ragCtrl.lawyerDeleteDocument
);
