import { DOCUMENT_TYPES } from "../../config/constants.js";

export const DOCUMENT_TYPE_LABELS = {
  [DOCUMENT_TYPES.BAR_LICENSE]: "Bar License",
  [DOCUMENT_TYPES.GOVERNMENT_ID]: "Government ID (CNIC)",
  [DOCUMENT_TYPES.PROFESSIONAL_CERTIFICATE]: "Professional Certificate",
  [DOCUMENT_TYPES.OTHER]: "Other"
};

export function documentTypeLabel(type) {
  return DOCUMENT_TYPE_LABELS[type] || type || "Document";
}
