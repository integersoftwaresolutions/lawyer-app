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
