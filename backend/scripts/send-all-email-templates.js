/**
 * Send one preview email per template to a given address.
 * Usage: node scripts/send-all-email-templates.js [email]
 */
import { NOTIFICATION_TYPES } from "../src/config/notification.constants.js";
import { EMAIL_TEMPLATE_MAP } from "../src/notifications/notification.registry.js";
import { notify } from "../src/notifications/notification.service.js";
import { appUrl } from "../src/notifications/helpers/format.js";

const TO = process.argv[2] || "faaiz290302@gmail.com";

const sampleVariables = {
  [NOTIFICATION_TYPES.EMAIL_VERIFICATION]: {
    headline: "Verify your email",
    preheader: "Your email verification code",
    recipientName: " Faaiz",
    otpCode: "482916",
    expiryMinutes: "10",
    verifyUrl: appUrl("/verify-email")
  },
  [NOTIFICATION_TYPES.PASSWORD_RESET]: {
    headline: "Reset your password",
    preheader: "Your password reset code",
    recipientName: " Faaiz",
    otpCode: "739104",
    expiryMinutes: "10",
    resetUrl: appUrl("/forgot-password")
  },
  [NOTIFICATION_TYPES.BOOKING_CONFIRMED]: {
    headline: "Booking confirmed",
    preheader: "Your consultation is confirmed",
    recipientName: " Faaiz",
    counterpartyName: "Adv. Sarah Khan",
    scheduledAt: "Monday, July 14, 2026 at 2:30 PM",
    durationMinutes: "30",
    consultationType: "Chat & Video",
    bookingUrl: appUrl("/client/bookings")
  },
  [NOTIFICATION_TYPES.BOOKING_REMINDER]: {
    headline: "Consultation reminder",
    preheader: "Reminder: consultation in 24 hours",
    recipientName: " Faaiz",
    counterpartyName: "Adv. Sarah Khan",
    scheduledAt: "Monday, July 14, 2026 at 2:30 PM",
    durationMinutes: "30",
    consultationType: "Chat & Video",
    reminderLabel: "24 hours",
    sessionUrl: appUrl("/chat/sample-booking-id")
  },
  [NOTIFICATION_TYPES.BOOKING_RESCHEDULED]: {
    headline: "Booking rescheduled",
    preheader: "Your consultation was moved",
    recipientName: " Faaiz",
    counterpartyName: "Adv. Sarah Khan",
    previousScheduledAt: "Monday, July 14, 2026 at 2:30 PM",
    scheduledAt: "Tuesday, July 15, 2026 at 4:00 PM",
    durationMinutes: "30",
    rescheduledByName: "Adv. Sarah Khan",
    bookingUrl: appUrl("/client/bookings")
  },
  [NOTIFICATION_TYPES.BOOKING_CANCELLED]: {
    headline: "Booking cancelled",
    preheader: "Your consultation was cancelled",
    recipientName: " Faaiz",
    counterpartyName: "Adv. Sarah Khan",
    scheduledAt: "Monday, July 14, 2026 at 2:30 PM",
    cancelledByText: " by the lawyer",
    bookingUrl: appUrl("/client/bookings")
  },
  [NOTIFICATION_TYPES.PLANNER_REMINDER]: {
    headline: "Planner reminder",
    preheader: "Court hearing starts in 1 hour",
    recipientName: " Faaiz",
    eventTitle: "High Court Hearing – Case #2024/1842",
    scheduledAt: "Monday, July 14, 2026 at 10:00 AM",
    eventType: "COURT HEARING",
    reminderLabel: "1 hour",
    locationBlock: '<p><span class="info-label">Location:</span> Lahore High Court, Courtroom 7</p>',
    plannerUrl: appUrl("/lawyer/planner")
  },
  [NOTIFICATION_TYPES.VERIFICATION_DOCUMENTS_RECEIVED]: {
    headline: "Document received",
    preheader: "Your Bar License was received",
    recipientName: " Faaiz",
    documentTypeLabel: "Bar License",
    verificationUrl: appUrl("/lawyer/verification")
  },
  [NOTIFICATION_TYPES.VERIFICATION_APPROVED]: {
    headline: "Verification approved",
    preheader: "Your profile is now verified",
    recipientName: " Faaiz",
    notesBlock: "",
    verificationUrl: appUrl("/lawyer/verification"),
    dashboardUrl: appUrl("/lawyer/overview")
  },
  [NOTIFICATION_TYPES.VERIFICATION_REJECTED]: {
    headline: "Verification rejected",
    preheader: "Your verification was not approved",
    recipientName: " Faaiz",
    notesBlock: "<p><span class=\"info-label\">Notes:</span> Bar license image was unclear. Please upload a higher quality scan.</p>",
    verificationUrl: appUrl("/lawyer/verification"),
    dashboardUrl: appUrl("/lawyer/overview")
  },
  [NOTIFICATION_TYPES.VERIFICATION_DOCUMENT_REJECTED]: {
    headline: "Document requires attention",
    preheader: "Your Government ID needs to be updated",
    recipientName: " Faaiz",
    documentTypeLabel: "Government ID (CNIC)",
    notesBlock: "<p><span class=\"info-label\">Notes:</span> CNIC number is not legible in the uploaded image.</p>",
    verificationUrl: appUrl("/lawyer/verification")
  },
  [NOTIFICATION_TYPES.ADMIN_LAWYER_DOCUMENTS_UPLOADED]: {
    headline: "New document for review",
    preheader: "A lawyer uploaded a document",
    recipientName: " Admin",
    lawyerName: "Adv. Faaiz Ahmed",
    lawyerEmail: "lawyer.example@email.com",
    documentTypeLabel: "Bar License",
    adminVerificationUrl: appUrl("/admin/verification")
  },
  [NOTIFICATION_TYPES.ADMIN_LAWYER_PENDING_VERIFICATION]: {
    headline: "Lawyer pending verification",
    preheader: "A lawyer is ready for review",
    recipientName: " Admin",
    lawyerName: "Adv. Faaiz Ahmed",
    lawyerEmail: "lawyer.example@email.com",
    documentCount: "3",
    adminVerificationUrl: appUrl("/admin/verification")
  }
};

async function main() {
  const types = Object.keys(EMAIL_TEMPLATE_MAP);
  console.log(`Sending ${types.length} template previews to ${TO}...\n`);

  let sent = 0;
  let failed = 0;

  for (const type of types) {
    const { subject } = EMAIL_TEMPLATE_MAP[type];
    const variables = sampleVariables[type] || {};
    const label = `[${type}] ${typeof subject === "function" ? subject(variables) : subject}`;

    try {
      await notify(type, [{ email: TO, variables }], { metadata: { preview: true } });
      console.log(`✅ ${label}`);
      sent++;
      await new Promise((r) => setTimeout(r, 1500));
    } catch (error) {
      console.error(`❌ ${label}: ${error.message}`);
      failed++;
    }
  }

  console.log(`\nDone. Sent: ${sent}, Failed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
