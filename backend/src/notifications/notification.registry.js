import { NOTIFICATION_TYPES } from "../config/notification.constants.js";

/** Maps notification types to email template files and subjects. */
export const EMAIL_TEMPLATE_MAP = {
  [NOTIFICATION_TYPES.EMAIL_VERIFICATION]: {
    template: "email-verification",
    subject: () => "Verify your email address"
  },
  [NOTIFICATION_TYPES.PASSWORD_RESET]: {
    template: "password-reset",
    subject: () => "Reset your password"
  },
  [NOTIFICATION_TYPES.BOOKING_CONFIRMED]: {
    template: "booking-confirmed",
    subject: () => "Your consultation is confirmed"
  },
  [NOTIFICATION_TYPES.BOOKING_REMINDER]: {
    template: "booking-reminder",
    subject: (v) => `Reminder: consultation in ${v.reminderLabel || "soon"}`
  },
  [NOTIFICATION_TYPES.BOOKING_RESCHEDULED]: {
    template: "booking-rescheduled",
    subject: () => "Your consultation has been rescheduled"
  },
  [NOTIFICATION_TYPES.BOOKING_CANCELLED]: {
    template: "booking-cancelled",
    subject: () => "Your consultation has been cancelled"
  },
  [NOTIFICATION_TYPES.PLANNER_REMINDER]: {
    template: "planner-reminder",
    subject: (v) => `Reminder: ${v.eventTitle || "upcoming event"}`
  },
  [NOTIFICATION_TYPES.VERIFICATION_DOCUMENTS_RECEIVED]: {
    template: "verification-documents-received",
    subject: () => "Verification document received"
  },
  [NOTIFICATION_TYPES.VERIFICATION_APPROVED]: {
    template: "verification-approved",
    subject: () => "Your lawyer verification was approved"
  },
  [NOTIFICATION_TYPES.VERIFICATION_REJECTED]: {
    template: "verification-rejected",
    subject: () => "Your lawyer verification was not approved"
  },
  [NOTIFICATION_TYPES.VERIFICATION_DOCUMENT_REJECTED]: {
    template: "verification-document-rejected",
    subject: () => "Verification document requires attention"
  },
  [NOTIFICATION_TYPES.ADMIN_LAWYER_DOCUMENTS_UPLOADED]: {
    template: "admin-lawyer-documents-uploaded",
    subject: (v) => `New document from ${v.lawyerName || "lawyer"} for review`
  },
  [NOTIFICATION_TYPES.ADMIN_LAWYER_PENDING_VERIFICATION]: {
    template: "admin-lawyer-pending-verification",
    subject: (v) => `Lawyer pending verification: ${v.lawyerName || "review required"}`
  },
  [NOTIFICATION_TYPES.WORKSPACE_INVITE]: {
    template: "workspace-invite",
    subject: (v) => `Invitation to join ${v.workspaceName || "a firm"}`
  },
  [NOTIFICATION_TYPES.CASE_ASSIGNED]: {
    template: "case-assigned",
    subject: (v) => `Assigned to case: ${v.caseName || "a matter"}`
  },
  [NOTIFICATION_TYPES.CASE_STATUS_CHANGED]: {
    template: "case-status-changed",
    subject: (v) => `Case status updated: ${v.caseName || "a matter"}`
  },
  [NOTIFICATION_TYPES.CASE_DOCUMENT_ATTACHED]: {
    template: "case-document-attached",
    subject: (v) => `Document added to ${v.caseName || "a case"}`
  }
};

export function getEmailConfig(type) {
  const config = EMAIL_TEMPLATE_MAP[type];
  if (!config) throw new Error(`Unknown notification type: ${type}`);
  return config;
}
