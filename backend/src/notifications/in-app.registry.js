import { NOTIFICATION_TYPES, NOTIFICATION_CHANNELS } from "../config/notification.constants.js";

/** Default channels per notification type. */
const DEFAULT_CHANNELS = {
  [NOTIFICATION_TYPES.EMAIL_VERIFICATION]: [NOTIFICATION_CHANNELS.EMAIL],
  [NOTIFICATION_TYPES.PASSWORD_RESET]: [NOTIFICATION_CHANNELS.EMAIL],
  [NOTIFICATION_TYPES.EMAIL_VERIFIED]: [NOTIFICATION_CHANNELS.IN_APP],
  [NOTIFICATION_TYPES.PASSWORD_CHANGED]: [NOTIFICATION_CHANNELS.IN_APP]
};

const PRODUCT_TYPES = [
  NOTIFICATION_TYPES.BOOKING_CONFIRMED,
  NOTIFICATION_TYPES.BOOKING_REMINDER,
  NOTIFICATION_TYPES.BOOKING_RESCHEDULED,
  NOTIFICATION_TYPES.BOOKING_CANCELLED,
  NOTIFICATION_TYPES.PLANNER_REMINDER,
  NOTIFICATION_TYPES.VERIFICATION_DOCUMENTS_RECEIVED,
  NOTIFICATION_TYPES.VERIFICATION_APPROVED,
  NOTIFICATION_TYPES.VERIFICATION_REJECTED,
  NOTIFICATION_TYPES.VERIFICATION_DOCUMENT_REJECTED,
  NOTIFICATION_TYPES.ADMIN_LAWYER_DOCUMENTS_UPLOADED,
  NOTIFICATION_TYPES.ADMIN_LAWYER_PENDING_VERIFICATION,
  NOTIFICATION_TYPES.WORKSPACE_INVITE
];

for (const type of PRODUCT_TYPES) {
  DEFAULT_CHANNELS[type] = [NOTIFICATION_CHANNELS.EMAIL, NOTIFICATION_CHANNELS.IN_APP];
}

/** In-app copy and deep links — paths are relative (frontend routes). */
export const IN_APP_CONTENT_MAP = {
  [NOTIFICATION_TYPES.BOOKING_CONFIRMED]: {
    title: () => "Booking confirmed",
    body: (v) => `Your consultation with ${v.counterpartyName || "your lawyer"} is confirmed for ${v.scheduledAt || "the scheduled time"}.`,
    link: (v) => v.bookingUrl || v.sessionUrl || "/"
  },
  [NOTIFICATION_TYPES.BOOKING_REMINDER]: {
    title: (v) => `Reminder: ${v.reminderLabel || "upcoming"} consultation`,
    body: (v) => `Consultation with ${v.counterpartyName || "your lawyer"} starts ${v.reminderLabel ? `in ${v.reminderLabel}` : "soon"} (${v.scheduledAt || ""}).`,
    link: (v) => v.sessionUrl || v.bookingUrl || "/"
  },
  [NOTIFICATION_TYPES.BOOKING_RESCHEDULED]: {
    title: () => "Booking rescheduled",
    body: (v) => `${v.rescheduledByName || "Someone"} moved your consultation to ${v.scheduledAt || "a new time"}.`,
    link: (v) => v.bookingUrl || "/"
  },
  [NOTIFICATION_TYPES.BOOKING_CANCELLED]: {
    title: () => "Booking cancelled",
    body: (v) => `Your consultation with ${v.counterpartyName || "your lawyer"} on ${v.scheduledAt || "the scheduled date"} was cancelled${v.cancelledByText || ""}.`,
    link: (v) => v.bookingUrl || "/"
  },
  [NOTIFICATION_TYPES.PLANNER_REMINDER]: {
    title: (v) => `Reminder: ${v.eventTitle || "Upcoming event"}`,
    body: (v) => `${v.eventTitle || "Your event"} starts ${v.reminderLabel ? `in ${v.reminderLabel}` : "soon"} (${v.scheduledAt || ""}).`,
    link: (v) => v.plannerUrl || "/lawyer/planner"
  },
  [NOTIFICATION_TYPES.VERIFICATION_DOCUMENTS_RECEIVED]: {
    title: () => "Document received",
    body: (v) => `We received your ${v.documentTypeLabel || "verification document"} and will review it shortly.`,
    link: (v) => v.verificationUrl || "/lawyer/verification"
  },
  [NOTIFICATION_TYPES.VERIFICATION_APPROVED]: {
    title: () => "Verification approved",
    body: () => "Your lawyer profile has been verified. You can now accept client bookings.",
    link: (v) => v.dashboardUrl || "/lawyer/overview"
  },
  [NOTIFICATION_TYPES.VERIFICATION_REJECTED]: {
    title: () => "Verification not approved",
    body: (v) => v.notesBlock ? "Your verification was not approved. Please review the feedback and resubmit." : "Your verification was not approved. Please review and resubmit your documents.",
    link: (v) => v.verificationUrl || "/lawyer/verification"
  },
  [NOTIFICATION_TYPES.VERIFICATION_DOCUMENT_REJECTED]: {
    title: () => "Document needs attention",
    body: (v) => `Your ${v.documentTypeLabel || "document"} was rejected. Please upload a corrected version.`,
    link: (v) => v.verificationUrl || "/lawyer/verification"
  },
  [NOTIFICATION_TYPES.ADMIN_LAWYER_DOCUMENTS_UPLOADED]: {
    title: () => "New document for review",
    body: (v) => `${v.lawyerName || "A lawyer"} uploaded ${v.documentTypeLabel || "a document"} for verification review.`,
    link: (v) => v.adminVerificationUrl || "/admin/verification"
  },
  [NOTIFICATION_TYPES.ADMIN_LAWYER_PENDING_VERIFICATION]: {
    title: () => "Lawyer pending verification",
    body: (v) => `${v.lawyerName || "A lawyer"} has submitted required documents and is awaiting your approval.`,
    link: (v) => v.adminVerificationUrl || "/admin/verification"
  },
  [NOTIFICATION_TYPES.WORKSPACE_INVITE]: {
    title: () => "Firm invitation",
    body: (v) => `${v.inviterEmail || "A colleague"} invited you to join ${v.workspaceName || "a firm"}.`,
    link: (v) => v.acceptUrl || "/lawyer/workspace"
  },
  [NOTIFICATION_TYPES.EMAIL_VERIFIED]: {
    title: () => "Email verified",
    body: () => "Your email address has been successfully verified.",
    link: (v) => v.profileUrl || "/"
  },
  [NOTIFICATION_TYPES.PASSWORD_CHANGED]: {
    title: () => "Password changed",
    body: () => "Your password was changed successfully. If you did not make this change, contact support immediately.",
    link: () => "/login"
  }
};

export function getDefaultChannels(type) {
  return DEFAULT_CHANNELS[type] || [NOTIFICATION_CHANNELS.EMAIL];
}

export function getInAppContent(type, variables = {}) {
  const config = IN_APP_CONTENT_MAP[type];
  if (!config) return null;

  const title = typeof config.title === "function" ? config.title(variables) : config.title;
  const body = typeof config.body === "function" ? config.body(variables) : config.body;
  let link = typeof config.link === "function" ? config.link(variables) : config.link || "/";

  // Strip app base URL if variables contain full URLs from email templates
  if (link.startsWith("http")) {
    try {
      const url = new URL(link);
      link = url.pathname + url.search;
    } catch {
      link = "/";
    }
  }

  return { title, body, link };
}

export function supportsInApp(type) {
  return Boolean(IN_APP_CONTENT_MAP[type]);
}
