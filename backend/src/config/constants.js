export const ROLES = {
  CLIENT: "CLIENT",
  LAWYER: "LAWYER",
  ADMIN: "ADMIN"
};

export const BOOKING_STATUS = {
  BOOKED: "BOOKED",
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
  EXPIRED: "EXPIRED",
  CANCELLED: "CANCELLED"
};

export const CONSULTATION_TYPE = {
  CHAT: "CHAT",
  VIDEO: "VIDEO",
  CHAT_VIDEO: "CHAT_VIDEO"
};

export const LEDGER_TYPES = {
  CREDIT_GRANT: "CREDIT_GRANT",
  TOPUP: "TOPUP",
  SPEND: "SPEND",
  REFUND: "REFUND",
  EARNING: "EARNING",
  EARNING_REVERSAL: "EARNING_REVERSAL",
  PAYOUT: "PAYOUT"
};

export const VERIFICATION_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED"
};

export const DISPUTE_STATUS = {
  OPEN: "OPEN",
  UNDER_REVIEW: "UNDER_REVIEW",
  RESOLVED: "RESOLVED"
};

export const DISPUTE_REASON = {
  NO_SHOW: "NO_SHOW",
  POOR_SERVICE: "POOR_SERVICE",
  BILLING_ISSUE: "BILLING_ISSUE",
  TECHNICAL_ISSUE: "TECHNICAL_ISSUE",
  OTHER: "OTHER"
};

export const DISPUTE_RESOLUTION = {
  REFUND_CLIENT_FULL: "REFUND_CLIENT_FULL",
  REFUND_CLIENT_PARTIAL: "REFUND_CLIENT_PARTIAL",
  NO_ACTION: "NO_ACTION",
  WARNING_LAWYER: "WARNING_LAWYER",
  DISMISSED: "DISMISSED"
};

export const DOCUMENT_TYPES = {
  BAR_LICENSE: "BAR_LICENSE",
  GOVERNMENT_ID: "GOVERNMENT_ID",
  PROFESSIONAL_CERTIFICATE: "PROFESSIONAL_CERTIFICATE",
  OTHER: "OTHER"
};

export const SPECIALIZATIONS = [
  "Family Law",
  "Criminal Law",
  "Corporate Law",
  "Property Law",
  "Immigration Law",
  "Intellectual Property",
  "Tax Law",
  "Labor Law",
  "Personal Injury",
  "Bankruptcy Law",
  "Civil Litigation",
  "Contract Law",
  "Constitutional Law",
  "Shariah Law",
  "Other"
];

export const AI_MODES = {
  RESEARCH: "research",
  CROSS_EXAM: "cross_exam"
};

export const AI_USAGE_TYPES = {
  CHAT_COMPLETION: "CHAT_COMPLETION",
  EMBEDDING: "EMBEDDING",
  REPORT_GENERATION: "REPORT_GENERATION"
};

export const RAG_SOURCE_TYPES = {
  CASE_LAW: "CASE_LAW",
  LEGAL_DOCUMENT: "LEGAL_DOCUMENT"
};

export const RAG_INGESTION_STATUS = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  INDEXED: "INDEXED",
  FAILED: "FAILED"
};

export const CROSS_EXAM_TONES = {
  AGGRESSIVE: "aggressive",
  MEASURED: "measured"
};

export const CROSS_EXAM_TYPES = {
  CRIMINAL: "criminal",
  CIVIL: "civil"
};

export const PAKISTANI_COURTS = [
  "Supreme Court of Pakistan",
  "Federal Shariat Court",
  "Lahore High Court",
  "Sindh High Court",
  "Islamabad High Court",
  "Peshawar High Court",
  "Balochistan High Court",
  "Other"
];

export const PLANNER_EVENT_TYPES = {
  COURT_HEARING: "COURT_HEARING",
  CLIENT_MEETING: "CLIENT_MEETING",
  INTERNAL: "INTERNAL",
  DEADLINE: "DEADLINE",
  OTHER: "OTHER",
  PLATFORM_BOOKING: "PLATFORM_BOOKING"
};

export const PLANNER_EVENT_SOURCES = {
  MANUAL: "MANUAL",
  BOOKING: "BOOKING"
};

export const PLANNER_EVENT_VISIBILITY = {
  PRIVATE: "PRIVATE",
  SHARED: "SHARED"
};

/** Calendar owner — enables lawyer & client calendars on same model. */
export const CALENDAR_OWNER_ROLES = {
  LAWYER: "LAWYER",
  CLIENT: "CLIENT"
};

export const CITIES = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Gujranwala",
  "Peshawar",
  "Quetta",
  "Sialkot",
  "Hyderabad",
  "Sargodha",
  "Bahawalpur",
  "Sukkur",
  "Larkana"
];

// ---------------------------------------------------------------------------
// Workspaces (Phase 1)
// ---------------------------------------------------------------------------

export const WORKSPACE_TYPES = {
  PERSONAL: "PERSONAL",
  FIRM: "FIRM"
};

export const MEMBERSHIP_STATUS = {
  ACTIVE: "ACTIVE",
  LEFT: "LEFT",
  REMOVED: "REMOVED"
};

export const WORKSPACE_INVITE_STATUS = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  REVOKED: "REVOKED",
  EXPIRED: "EXPIRED"
};

export const DOCUMENT_VISIBILITY = {
  PRIVATE: "PRIVATE",
  FIRM: "FIRM",
  PUBLIC: "PUBLIC"
};

export const BUILTIN_ROLE_KEYS = {
  ADMIN: "ADMIN",
  LAWYER: "LAWYER",
  PARALEGAL: "PARALEGAL"
};

/** Soft caps until Phase 3 plan gating. */
export const WORKSPACE_LIMITS = {
  MAX_OWNED_FIRMS: 3,
  MAX_JOINED_FIRMS: 10
};

export const WORKSPACE_AUDIT_ACTIONS = {
  FIRM_CREATED: "firm.created",
  FIRM_UPDATED: "firm.updated",
  FIRM_DISSOLVED: "firm.dissolved",
  OWNERSHIP_TRANSFERRED: "ownership.transferred",
  MEMBER_INVITED: "member.invited",
  MEMBER_JOINED: "member.joined",
  MEMBER_REMOVED: "member.removed",
  MEMBER_LEFT: "member.left",
  MEMBER_ROLE_CHANGED: "member.role_changed",
  ROLE_CREATED: "role.created",
  ROLE_UPDATED: "role.updated",
  ROLE_DELETED: "role.deleted",
  INVITE_REVOKED: "invite.revoked",
  DOC_VISIBILITY_CHANGED: "doc.visibility_changed"
};
