import { NOTIFICATION_TYPES } from "../../config/notification.constants.js";
import { VERIFICATION_STATUS } from "../../config/constants.js";
import VerificationDocument from "../../models/VerificationDocument.js";
import { notifyAsync } from "../notification.service.js";
import {
  loadLawyerVerificationContext,
  getAdminRecipients,
  shouldNotifyAdminPendingVerification,
  greetingName,
  notesBlock,
  documentTypeLabel
} from "../notification.context.js";
import { appUrl } from "../helpers/format.js";

export async function notifyDocumentsReceived({ lawyerUserId, documentType }) {
  const lawyer = await loadLawyerVerificationContext(lawyerUserId);
  if (!lawyer) return;

  const label = documentTypeLabel(documentType);

  notifyAsync(NOTIFICATION_TYPES.VERIFICATION_DOCUMENTS_RECEIVED, [{
    email: lawyer.email,
    userId: lawyer.userId,
    variables: {
      headline: "Document received",
      preheader: `Your ${label} was received`,
      recipientName: greetingName(lawyer.name),
      documentTypeLabel: label,
      verificationUrl: lawyer.verificationUrl
    }
  }], { metadata: { lawyerUserId, documentType } });

  const admins = await getAdminRecipients();
  if (admins.length) {
    notifyAsync(
      NOTIFICATION_TYPES.ADMIN_LAWYER_DOCUMENTS_UPLOADED,
      admins.map((admin) => ({
        email: admin.email,
        userId: admin.userId,
        variables: {
          headline: "New document for review",
          preheader: `${lawyer.name} uploaded ${label}`,
          recipientName: greetingName(admin.name),
          lawyerName: lawyer.name,
          lawyerEmail: lawyer.email,
          documentTypeLabel: label,
          adminVerificationUrl: appUrl("/admin/verification")
        }
      })),
      { metadata: { lawyerUserId, documentType } }
    );
  }

  const pending = await shouldNotifyAdminPendingVerification(lawyerUserId);
  if (pending && admins.length) {
    const docCount = await VerificationDocument.countDocuments({ lawyerUserId });
    notifyAsync(
      NOTIFICATION_TYPES.ADMIN_LAWYER_PENDING_VERIFICATION,
      admins.map((admin) => ({
        email: admin.email,
        userId: admin.userId,
        variables: {
          headline: "Lawyer pending verification",
          preheader: `${lawyer.name} is ready for review`,
          recipientName: greetingName(admin.name),
          lawyerName: lawyer.name,
          lawyerEmail: lawyer.email,
          documentCount: String(docCount),
          adminVerificationUrl: appUrl("/admin/verification")
        }
      })),
      { metadata: { lawyerUserId } }
    );
  }
}

export async function notifyDocumentRejected({ lawyerUserId, documentType, notes }) {
  const lawyer = await loadLawyerVerificationContext(lawyerUserId);
  if (!lawyer) return;

  const label = documentTypeLabel(documentType);

  notifyAsync(NOTIFICATION_TYPES.VERIFICATION_DOCUMENT_REJECTED, [{
    email: lawyer.email,
    userId: lawyer.userId,
    variables: {
      headline: "Document requires attention",
      preheader: `Your ${label} needs to be updated`,
      recipientName: greetingName(lawyer.name),
      documentTypeLabel: label,
      notesBlock: notesBlock(notes),
      verificationUrl: lawyer.verificationUrl
    }
  }], { metadata: { lawyerUserId, documentType } });
}

export async function notifyVerificationDecision({ lawyerUserId, status, notes }) {
  const lawyer = await loadLawyerVerificationContext(lawyerUserId);
  if (!lawyer) return;

  const type =
    status === VERIFICATION_STATUS.APPROVED
      ? NOTIFICATION_TYPES.VERIFICATION_APPROVED
      : NOTIFICATION_TYPES.VERIFICATION_REJECTED;

  notifyAsync(type, [{
    email: lawyer.email,
    userId: lawyer.userId,
    variables: {
      headline: status === VERIFICATION_STATUS.APPROVED ? "Verification approved" : "Verification rejected",
      preheader:
        status === VERIFICATION_STATUS.APPROVED
          ? "Your profile is now verified"
          : "Your verification was not approved",
      recipientName: greetingName(lawyer.name),
      notesBlock: notesBlock(notes),
      verificationUrl: lawyer.verificationUrl,
      dashboardUrl: lawyer.dashboardUrl
    }
  }], { metadata: { lawyerUserId, status } });
}
