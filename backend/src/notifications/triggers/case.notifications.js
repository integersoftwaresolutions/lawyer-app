import { NOTIFICATION_TYPES } from "../../config/notification.constants.js";
import { notifyAsync } from "../notification.service.js";

function caseUrl(caseId) {
  return `/lawyer/cases/${caseId}`;
}

function statusLabel(status) {
  return String(status || "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function priorityLabel(priority) {
  return statusLabel(priority);
}

function recipientPayload(userId, vars) {
  return {
    userId: String(userId),
    email: vars.emailsByUserId?.[String(userId)] || undefined,
    variables: {
      recipientName: vars.namesByUserId?.[String(userId)]
        ? ` ${vars.namesByUserId[String(userId)]}`
        : "",
      ...vars.shared
    }
  };
}

/**
 * @param {{ caseDoc: object, actorUserId: string, actorName?: string, recipientUserIds: string[], emailsByUserId?: object, namesByUserId?: object, roleLabel?: string }} args
 */
export function notifyCaseAssigned({
  caseDoc,
  actorUserId,
  actorName,
  recipientUserIds,
  emailsByUserId = {},
  namesByUserId = {},
  roleLabel = ""
}) {
  const recipients = recipientUserIds
    .filter((id) => String(id) !== String(actorUserId))
    .map((userId) =>
      recipientPayload(userId, {
        emailsByUserId,
        namesByUserId,
        shared: {
          actorName: actorName || "A colleague",
          caseName: caseDoc.name,
          statusLabel: statusLabel(caseDoc.status),
          priorityLabel: priorityLabel(caseDoc.priority),
          roleLabel,
          roleLabelBlock: roleLabel ? ` as ${roleLabel}` : "",
          caseUrl: caseUrl(caseDoc._id)
        }
      })
    );
  if (!recipients.length) return;
  notifyAsync(NOTIFICATION_TYPES.CASE_ASSIGNED, recipients, {
    metadata: { caseId: String(caseDoc._id), workspaceId: String(caseDoc.workspaceId) }
  });
}

export function notifyCaseStatusChanged({
  caseDoc,
  actorUserId,
  actorName,
  previousStatus,
  recipientUserIds,
  emailsByUserId = {},
  namesByUserId = {}
}) {
  const recipients = recipientUserIds
    .filter((id) => String(id) !== String(actorUserId))
    .map((userId) =>
      recipientPayload(userId, {
        emailsByUserId,
        namesByUserId,
        shared: {
          actorName: actorName || "A colleague",
          actorBlock: actorName ? ` (updated by ${actorName})` : "",
          caseName: caseDoc.name,
          status: caseDoc.status,
          statusLabel: statusLabel(caseDoc.status),
          previousStatusLabel: statusLabel(previousStatus),
          priorityLabel: priorityLabel(caseDoc.priority),
          caseUrl: caseUrl(caseDoc._id)
        }
      })
    );
  if (!recipients.length) return;
  notifyAsync(NOTIFICATION_TYPES.CASE_STATUS_CHANGED, recipients, {
    metadata: { caseId: String(caseDoc._id), workspaceId: String(caseDoc.workspaceId) }
  });
}

export function notifyCaseDocumentAttached({
  caseDoc,
  actorUserId,
  actorName,
  documentTitle,
  recipientUserIds,
  emailsByUserId = {},
  namesByUserId = {}
}) {
  const recipients = recipientUserIds
    .filter((id) => String(id) !== String(actorUserId))
    .map((userId) =>
      recipientPayload(userId, {
        emailsByUserId,
        namesByUserId,
        shared: {
          actorName: actorName || "Someone",
          caseName: caseDoc.name,
          documentTitle: documentTitle || "a document",
          caseUrl: caseUrl(caseDoc._id)
        }
      })
    );
  if (!recipients.length) return;
  notifyAsync(NOTIFICATION_TYPES.CASE_DOCUMENT_ATTACHED, recipients, {
    metadata: { caseId: String(caseDoc._id), workspaceId: String(caseDoc.workspaceId) }
  });
}
