import mongoose from "mongoose";
import {
  CASE_LIST_SCOPES,
  CASE_PRIORITY,
  CASE_STATUS,
  CASE_TYPES,
  CASE_VISIBILITY,
  MEMBERSHIP_STATUS,
  PAKISTANI_COURTS,
  WORKSPACE_AUDIT_ACTIONS,
  DOCUMENT_VISIBILITY
} from "../config/constants.js";
import { ApiError } from "../helpers/apiError.js";
import Case from "../models/Case.js";
import Booking from "../models/Booking.js";
import LegalDocument from "../models/LegalDocument.js";
import Membership from "../models/Membership.js";
import User from "../models/User.js";
import LawyerProfile from "../models/LawyerProfile.js";
import { listResult, getPagination } from "../utils/pagination.js";
import { writeAudit } from "./workspace.service.js";
import * as ingestService from "./ai/ingest/ingest.service.js";
import {
  buildScopeFilter,
  buildVisibilityAccessFilter,
  canArchiveCase,
  canAssignCase,
  canAttachDocuments,
  canDeleteCase,
  canEditCase,
  canManageNotes,
  canViewCase,
  uniqueUserIds
} from "./caseAccess.js";
import {
  notifyCaseAssigned,
  notifyCaseDocumentAttached,
  notifyCaseStatusChanged
} from "../notifications/triggers/case.notifications.js";
import { PERMISSIONS, hasPermission } from "../workspaces/permissions.catalog.js";

function oid(id) {
  return new mongoose.Types.ObjectId(String(id));
}

function partyPatch(input = {}) {
  if (!input || typeof input !== "object") return undefined;
  const out = {};
  for (const key of ["client", "opponent", "court", "counsel"]) {
    if (input[key] && typeof input[key] === "object") {
      out[key] = {
        name: input[key].name != null ? String(input[key].name).trim() : "",
        contact: input[key].contact != null ? String(input[key].contact).trim() : "",
        counsel: input[key].counsel != null ? String(input[key].counsel).trim() : ""
      };
    }
  }
  return Object.keys(out).length ? out : undefined;
}

async function assertMembers(workspaceId, userIds) {
  const ids = [...new Set(userIds.filter(Boolean).map(String))];
  if (!ids.length) return;
  const count = await Membership.countDocuments({
    workspaceId,
    userId: { $in: ids.map(oid) },
    status: MEMBERSHIP_STATUS.ACTIVE,
    deletedAt: null
  });
  if (count !== ids.length) {
    throw new ApiError(400, "All assigned users must be active workspace members");
  }
}

async function loadCaseOrThrow(workspaceId, caseId) {
  const doc = await Case.findOne({
    _id: caseId,
    workspaceId,
    isDeleted: false
  });
  if (!doc) throw new ApiError(404, "Case not found");
  return doc;
}

function formatNote(note) {
  return {
    id: note._id,
    body: note.body,
    authorUserId: note.authorUserId,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt
  };
}

function formatCase(doc, { includeNotes = false, documentCount = undefined } = {}) {
  const row = doc.toObject ? doc.toObject() : doc;
  const notes = (row.notes || []).filter((n) => !n.isDeleted);
  return {
    id: row._id,
    workspaceId: row.workspaceId,
    name: row.name,
    type: row.type,
    typeCustom: row.typeCustom,
    status: row.status,
    customLabels: row.customLabels || [],
    priority: row.priority,
    summary: row.summary,
    description: row.description,
    tags: row.tags || [],
    openedAt: row.openedAt,
    nextHearingAt: row.nextHearingAt,
    filingAt: row.filingAt,
    closedAt: row.closedAt,
    court: row.court,
    jurisdictionCity: row.jurisdictionCity,
    caseNumber: row.caseNumber,
    parties: row.parties,
    primaryLawyerUserId: row.primaryLawyerUserId,
    collaboratorUserIds: row.collaboratorUserIds || [],
    visibility: row.visibility,
    restrictedMemberIds: row.restrictedMemberIds || [],
    bookingId: row.bookingId,
    isArchived: row.isArchived,
    archivedAt: row.archivedAt,
    createdByUserId: row.createdByUserId,
    updatedByUserId: row.updatedByUserId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    noteCount: notes.length,
    ...(documentCount !== undefined ? { documentCount } : {}),
    ...(includeNotes ? { notes: notes.map(formatNote) } : {})
  };
}

async function resolveUserMaps(userIds) {
  const ids = [...new Set(userIds.filter(Boolean).map(String))];
  if (!ids.length) return { emailsByUserId: {}, namesByUserId: {} };
  const [users, profiles] = await Promise.all([
    User.find({ _id: { $in: ids } }).select("email").lean(),
    LawyerProfile.find({ userId: { $in: ids } }).select("userId fullName").lean()
  ]);
  const emailsByUserId = {};
  const namesByUserId = {};
  for (const u of users) emailsByUserId[String(u._id)] = u.email;
  for (const p of profiles) {
    if (p.fullName) namesByUserId[String(p.userId)] = p.fullName;
  }
  return { emailsByUserId, namesByUserId };
}

function teamRecipientIds(caseDoc) {
  return uniqueUserIds(
    [caseDoc.primaryLawyerUserId],
    caseDoc.collaboratorUserIds || [],
    [caseDoc.createdByUserId]
  );
}

async function notifyTeam(caseDoc, actorUserId, fn) {
  const recipientUserIds = teamRecipientIds(caseDoc);
  const { emailsByUserId, namesByUserId } = await resolveUserMaps([
    ...recipientUserIds,
    actorUserId
  ]);
  const actorName = namesByUserId[String(actorUserId)] || emailsByUserId[String(actorUserId)] || "A colleague";
  fn({
    caseDoc,
    actorUserId,
    actorName,
    recipientUserIds,
    emailsByUserId,
    namesByUserId
  });
}

export async function listCases(ctx, query = {}) {
  const { workspaceId, userId, isOwner, permissions } = ctx;
  if (!hasPermission(permissions, PERMISSIONS.CASES_VIEW) && !isOwner) {
    throw new ApiError(403, "Missing permission: cases.view");
  }

  const scope = query.scope || CASE_LIST_SCOPES.MINE;
  if (!Object.values(CASE_LIST_SCOPES).includes(scope)) {
    throw new ApiError(400, "Invalid scope");
  }

  const includeArchived =
    query.includeArchived === true ||
    query.includeArchived === "true" ||
    query.includeArchived === "1";

  const pagination = getPagination(query);
  const and = [
    { workspaceId: oid(workspaceId), isDeleted: false },
    buildVisibilityAccessFilter(userId, { isOwner })
  ];

  const scopeFilter = buildScopeFilter(scope, userId);
  if (Object.keys(scopeFilter).length) and.push(scopeFilter);

  if (!includeArchived) and.push({ isArchived: false });

  if (query.status) and.push({ status: query.status });
  if (query.priority) and.push({ priority: query.priority });
  if (query.type) and.push({ type: query.type });
  if (query.primaryLawyerUserId) {
    and.push({ primaryLawyerUserId: oid(query.primaryLawyerUserId) });
  }
  if (query.tags) {
    const tags = Array.isArray(query.tags)
      ? query.tags
      : String(query.tags)
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
    if (tags.length) and.push({ tags: { $in: tags } });
  }
  if (query.openedFrom || query.openedTo) {
    const openedAt = {};
    if (query.openedFrom) openedAt.$gte = new Date(query.openedFrom);
    if (query.openedTo) openedAt.$lte = new Date(query.openedTo);
    and.push({ openedAt });
  }
  if (query.nextHearingFrom || query.nextHearingTo) {
    const nextHearingAt = {};
    if (query.nextHearingFrom) nextHearingAt.$gte = new Date(query.nextHearingFrom);
    if (query.nextHearingTo) nextHearingAt.$lte = new Date(query.nextHearingTo);
    and.push({ nextHearingAt });
  }

  if (query.q) {
    const q = String(query.q).trim();
    if (q) {
      const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      and.push({
        $or: [{ name: re }, { summary: re }, { caseNumber: re }, { tags: re }]
      });
    }
  }

  const filter = and.length === 1 ? and[0] : { $and: and };
  const sort = { updatedAt: -1 };

  const [total, items] = await Promise.all([
    Case.countDocuments(filter),
    Case.find(filter).sort(sort).skip(pagination.skip).limit(pagination.limit).lean()
  ]);

  return listResult({
    items: items.map((row) => formatCase(row)),
    total,
    pagination
  });
}

export async function getCase(ctx, caseId) {
  const doc = await loadCaseOrThrow(ctx.workspaceId, caseId);
  if (!canViewCase(doc, ctx)) throw new ApiError(403, "You cannot view this case");

  const documentCount = await LegalDocument.countDocuments({
    workspaceId: ctx.workspaceId,
    caseId: doc._id,
    isDeleted: false
  });

  return formatCase(doc, { includeNotes: true, documentCount });
}

export async function createCase(ctx, body) {
  const { workspaceId, userId, isOwner, permissions } = ctx;
  if (!hasPermission(permissions, PERMISSIONS.CASES_CREATE) && !isOwner) {
    throw new ApiError(403, "Missing permission: cases.create");
  }

  const primaryLawyerUserId = body.primaryLawyerUserId
    ? String(body.primaryLawyerUserId)
    : String(userId);
  const collaboratorUserIds = (body.collaboratorUserIds || []).map(String);
  const restrictedMemberIds = (body.restrictedMemberIds || []).map(String);

  await assertMembers(workspaceId, [
    primaryLawyerUserId,
    ...collaboratorUserIds,
    ...restrictedMemberIds
  ]);

  const visibility = body.visibility || CASE_VISIBILITY.PRIVATE;
  if (visibility === CASE_VISIBILITY.RESTRICTED && !restrictedMemberIds.length) {
    // allowed — restricted to assignees only
  }

  const doc = await Case.create({
    workspaceId,
    name: body.name.trim(),
    type: body.type,
    typeCustom: body.type === CASE_TYPES.OTHER ? body.typeCustom?.trim() || "" : "",
    status: body.status || CASE_STATUS.INTAKE,
    customLabels: body.customLabels || [],
    priority: body.priority || CASE_PRIORITY.MEDIUM,
    summary: body.summary?.trim() || "",
    description: body.description?.trim() || "",
    tags: body.tags || [],
    openedAt: body.openedAt ? new Date(body.openedAt) : new Date(),
    nextHearingAt: body.nextHearingAt ? new Date(body.nextHearingAt) : null,
    filingAt: body.filingAt ? new Date(body.filingAt) : null,
    closedAt: body.status === CASE_STATUS.CLOSED ? new Date() : null,
    court: body.court || "",
    jurisdictionCity: body.jurisdictionCity?.trim() || "",
    caseNumber: body.caseNumber?.trim() || "",
    parties: partyPatch(body.parties) || {},
    primaryLawyerUserId,
    collaboratorUserIds,
    visibility,
    restrictedMemberIds,
    bookingId: body.bookingId || null,
    createdByUserId: userId,
    updatedByUserId: userId
  });

  await writeAudit({
    workspaceId,
    actorUserId: userId,
    action: WORKSPACE_AUDIT_ACTIONS.CASE_CREATED,
    meta: { caseId: String(doc._id), name: doc.name }
  });

  await notifyTeam(doc, userId, (args) =>
    notifyCaseAssigned({ ...args, roleLabel: "team member" })
  );

  return formatCase(doc, { includeNotes: true, documentCount: 0 });
}

export async function updateCase(ctx, caseId, body) {
  const doc = await loadCaseOrThrow(ctx.workspaceId, caseId);
  if (!canEditCase(doc, ctx)) throw new ApiError(403, "Missing permission to edit this case");

  const prevVisibility = doc.visibility;

  if (body.name != null) doc.name = String(body.name).trim();
  if (body.type != null) {
    doc.type = body.type;
    doc.typeCustom =
      body.type === CASE_TYPES.OTHER ? String(body.typeCustom || "").trim() : "";
  }
  if (body.typeCustom != null && doc.type === CASE_TYPES.OTHER) {
    doc.typeCustom = String(body.typeCustom).trim();
  }
  if (body.priority != null) doc.priority = body.priority;
  if (body.summary != null) doc.summary = String(body.summary).trim();
  if (body.description != null) doc.description = String(body.description).trim();
  if (body.tags != null) doc.tags = body.tags;
  if (body.customLabels != null) doc.customLabels = body.customLabels;
  if (body.openedAt !== undefined) {
    doc.openedAt = body.openedAt ? new Date(body.openedAt) : null;
  }
  if (body.nextHearingAt !== undefined) {
    doc.nextHearingAt = body.nextHearingAt ? new Date(body.nextHearingAt) : null;
  }
  if (body.filingAt !== undefined) {
    doc.filingAt = body.filingAt ? new Date(body.filingAt) : null;
  }
  if (body.closedAt !== undefined) {
    doc.closedAt = body.closedAt ? new Date(body.closedAt) : null;
  }
  if (body.court !== undefined) doc.court = body.court || "";
  if (body.jurisdictionCity != null) {
    doc.jurisdictionCity = String(body.jurisdictionCity).trim();
  }
  if (body.caseNumber != null) doc.caseNumber = String(body.caseNumber).trim();
  if (body.parties != null) {
    const patch = partyPatch(body.parties);
    if (patch) {
      doc.parties = { ...(doc.parties?.toObject?.() || doc.parties || {}), ...patch };
    }
  }
  if (body.visibility != null) {
    doc.visibility = body.visibility;
  }
  if (body.restrictedMemberIds != null) {
    const ids = body.restrictedMemberIds.map(String);
    await assertMembers(ctx.workspaceId, ids);
    doc.restrictedMemberIds = ids;
  }

  doc.updatedByUserId = ctx.userId;
  await doc.save();

  await writeAudit({
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.userId,
    action:
      prevVisibility !== doc.visibility
        ? WORKSPACE_AUDIT_ACTIONS.CASE_VISIBILITY_CHANGED
        : WORKSPACE_AUDIT_ACTIONS.CASE_UPDATED,
    meta: {
      caseId: String(doc._id),
      ...(prevVisibility !== doc.visibility
        ? { from: prevVisibility, to: doc.visibility }
        : {})
    }
  });

  return formatCase(doc, { includeNotes: true });
}

export async function changeCaseStatus(ctx, caseId, { status }) {
  const doc = await loadCaseOrThrow(ctx.workspaceId, caseId);
  if (!canEditCase(doc, ctx)) throw new ApiError(403, "Missing permission to edit this case");

  const previousStatus = doc.status;
  doc.status = status;
  if (status === CASE_STATUS.CLOSED && !doc.closedAt) doc.closedAt = new Date();
  if (status === CASE_STATUS.ARCHIVED) {
    doc.isArchived = true;
    doc.archivedAt = doc.archivedAt || new Date();
  }
  if (status !== CASE_STATUS.CLOSED) {
    // keep closedAt history unless reopening actively
  }
  if ([CASE_STATUS.INTAKE, CASE_STATUS.ACTIVE, CASE_STATUS.ON_HOLD].includes(status)) {
    doc.closedAt = null;
  }
  doc.updatedByUserId = ctx.userId;
  await doc.save();

  await writeAudit({
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.userId,
    action: WORKSPACE_AUDIT_ACTIONS.CASE_STATUS_CHANGED,
    meta: { caseId: String(doc._id), from: previousStatus, to: status }
  });

  if (previousStatus !== status) {
    await notifyTeam(doc, ctx.userId, (args) =>
      notifyCaseStatusChanged({ ...args, previousStatus })
    );
  }

  return formatCase(doc, { includeNotes: true });
}

export async function assignCase(ctx, caseId, body) {
  const doc = await loadCaseOrThrow(ctx.workspaceId, caseId);
  if (!canAssignCase(doc, ctx)) throw new ApiError(403, "Missing permission: cases.assign");

  const primaryLawyerUserId = String(body.primaryLawyerUserId);
  const collaboratorUserIds = (body.collaboratorUserIds || []).map(String);
  await assertMembers(ctx.workspaceId, [primaryLawyerUserId, ...collaboratorUserIds]);

  const prevTeam = new Set(teamRecipientIds(doc));
  doc.primaryLawyerUserId = primaryLawyerUserId;
  doc.collaboratorUserIds = collaboratorUserIds.filter((id) => id !== primaryLawyerUserId);
  doc.updatedByUserId = ctx.userId;
  await doc.save();

  await writeAudit({
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.userId,
    action: WORKSPACE_AUDIT_ACTIONS.CASE_ASSIGNED,
    meta: {
      caseId: String(doc._id),
      primaryLawyerUserId,
      collaboratorUserIds: doc.collaboratorUserIds
    }
  });

  const newlyAssigned = teamRecipientIds(doc).filter((id) => !prevTeam.has(String(id)));
  if (newlyAssigned.length) {
    const { emailsByUserId, namesByUserId } = await resolveUserMaps([
      ...newlyAssigned,
      ctx.userId
    ]);
    notifyCaseAssigned({
      caseDoc: doc,
      actorUserId: ctx.userId,
      actorName: namesByUserId[String(ctx.userId)] || "A colleague",
      recipientUserIds: newlyAssigned,
      emailsByUserId,
      namesByUserId,
      roleLabel: "assignee"
    });
  }

  return formatCase(doc, { includeNotes: true });
}

export async function archiveCase(ctx, caseId) {
  const doc = await loadCaseOrThrow(ctx.workspaceId, caseId);
  if (!canArchiveCase(doc, ctx)) throw new ApiError(403, "Missing permission: cases.archive");
  doc.isArchived = true;
  doc.archivedAt = new Date();
  doc.updatedByUserId = ctx.userId;
  await doc.save();
  await writeAudit({
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.userId,
    action: WORKSPACE_AUDIT_ACTIONS.CASE_ARCHIVED,
    meta: { caseId: String(doc._id) }
  });
  return formatCase(doc, { includeNotes: true });
}

export async function restoreCase(ctx, caseId) {
  const doc = await loadCaseOrThrow(ctx.workspaceId, caseId);
  if (!canArchiveCase(doc, ctx)) throw new ApiError(403, "Missing permission: cases.archive");
  doc.isArchived = false;
  doc.archivedAt = null;
  if (doc.status === CASE_STATUS.ARCHIVED) doc.status = CASE_STATUS.ACTIVE;
  doc.updatedByUserId = ctx.userId;
  await doc.save();
  await writeAudit({
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.userId,
    action: WORKSPACE_AUDIT_ACTIONS.CASE_RESTORED,
    meta: { caseId: String(doc._id) }
  });
  return formatCase(doc, { includeNotes: true });
}

export async function deleteCase(ctx, caseId) {
  const doc = await loadCaseOrThrow(ctx.workspaceId, caseId);
  if (!canDeleteCase(doc, ctx)) throw new ApiError(403, "Missing permission: cases.delete");

  const attached = await LegalDocument.find({
    workspaceId: ctx.workspaceId,
    caseId: doc._id,
    isDeleted: false
  })
    .select("_id")
    .lean();

  for (const d of attached) {
    await ingestService.deleteLegalDocument(d._id, { workspaceId: ctx.workspaceId });
  }

  doc.isDeleted = true;
  doc.deletedAt = new Date();
  doc.updatedByUserId = ctx.userId;
  await doc.save();

  await writeAudit({
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.userId,
    action: WORKSPACE_AUDIT_ACTIONS.CASE_DELETED,
    meta: { caseId: String(doc._id), purgedDocuments: attached.length }
  });

  return { id: doc._id, deleted: true, purgedDocuments: attached.length };
}

export async function addNote(ctx, caseId, { body }) {
  const doc = await loadCaseOrThrow(ctx.workspaceId, caseId);
  if (!canManageNotes(doc, ctx)) throw new ApiError(403, "Missing permission to add notes");
  const now = new Date();
  doc.notes.push({
    body: String(body).trim(),
    authorUserId: ctx.userId,
    createdAt: now,
    updatedAt: now,
    isDeleted: false
  });
  doc.updatedByUserId = ctx.userId;
  await doc.save();
  const note = doc.notes[doc.notes.length - 1];
  await writeAudit({
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.userId,
    action: WORKSPACE_AUDIT_ACTIONS.CASE_NOTE_ADDED,
    meta: { caseId: String(doc._id), noteId: String(note._id) }
  });
  return formatNote(note);
}

export async function updateNote(ctx, caseId, noteId, { body }) {
  const doc = await loadCaseOrThrow(ctx.workspaceId, caseId);
  if (!canManageNotes(doc, ctx)) throw new ApiError(403, "Missing permission to edit notes");
  const note = doc.notes.id(noteId);
  if (!note || note.isDeleted) throw new ApiError(404, "Note not found");
  const isAuthor = String(note.authorUserId) === String(ctx.userId);
  if (!isAuthor && !ctx.isOwner) {
    throw new ApiError(403, "Only the author or workspace owner can edit this note");
  }
  note.body = String(body).trim();
  note.updatedAt = new Date();
  doc.updatedByUserId = ctx.userId;
  await doc.save();
  return formatNote(note);
}

export async function deleteNote(ctx, caseId, noteId) {
  const doc = await loadCaseOrThrow(ctx.workspaceId, caseId);
  if (!canManageNotes(doc, ctx)) throw new ApiError(403, "Missing permission to delete notes");
  const note = doc.notes.id(noteId);
  if (!note || note.isDeleted) throw new ApiError(404, "Note not found");
  const isAuthor = String(note.authorUserId) === String(ctx.userId);
  if (!isAuthor && !ctx.isOwner) {
    throw new ApiError(403, "Only the author or workspace owner can delete this note");
  }
  note.isDeleted = true;
  note.updatedAt = new Date();
  doc.updatedByUserId = ctx.userId;
  await doc.save();
  return { id: note._id, deleted: true };
}

export async function listCaseDocuments(ctx, caseId, query = {}) {
  const doc = await loadCaseOrThrow(ctx.workspaceId, caseId);
  if (!canViewCase(doc, ctx)) throw new ApiError(403, "You cannot view this case");
  if (!hasPermission(ctx.permissions, PERMISSIONS.DOCS_VIEW) && !ctx.isOwner) {
    throw new ApiError(403, "Missing permission: docs.view");
  }

  const pagination = getPagination(query);
  const filter = {
    workspaceId: ctx.workspaceId,
    caseId: doc._id,
    isDeleted: false
  };
  if (!ctx.isOwner) {
    filter.$or = [
      { visibility: { $in: [DOCUMENT_VISIBILITY.FIRM, DOCUMENT_VISIBILITY.PUBLIC] } },
      { visibility: DOCUMENT_VISIBILITY.PRIVATE, uploadedByUserId: ctx.userId }
    ];
  }

  const [total, items] = await Promise.all([
    LegalDocument.countDocuments(filter),
    LegalDocument.find(filter)
      .select("-rawText")
      .sort({ updatedAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean()
  ]);

  return listResult({
    items: items.map((row) => ({
      id: row._id,
      title: row.title,
      visibility: row.visibility,
      status: row.status,
      caseId: row.caseId,
      caseRef: row.caseRef,
      uploadedByUserId: row.uploadedByUserId,
      updatedAt: row.updatedAt,
      createdAt: row.createdAt
    })),
    total,
    pagination
  });
}

export async function attachDocument(ctx, caseId, documentId) {
  const caseDoc = await loadCaseOrThrow(ctx.workspaceId, caseId);
  if (!canAttachDocuments(caseDoc, ctx)) {
    throw new ApiError(403, "Missing permission to attach documents");
  }

  const legalDoc = await LegalDocument.findOne({
    _id: documentId,
    workspaceId: ctx.workspaceId,
    isDeleted: false
  });
  if (!legalDoc) throw new ApiError(404, "Document not found");

  legalDoc.caseId = caseDoc._id;
  await legalDoc.save();

  await writeAudit({
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.userId,
    action: WORKSPACE_AUDIT_ACTIONS.CASE_DOC_ATTACHED,
    meta: { caseId: String(caseDoc._id), documentId: String(legalDoc._id) }
  });

  await notifyTeam(caseDoc, ctx.userId, (args) =>
    notifyCaseDocumentAttached({ ...args, documentTitle: legalDoc.title })
  );

  return {
    caseId: caseDoc._id,
    documentId: legalDoc._id,
    title: legalDoc.title
  };
}

export async function detachDocument(ctx, caseId, documentId) {
  const caseDoc = await loadCaseOrThrow(ctx.workspaceId, caseId);
  if (!canAttachDocuments(caseDoc, ctx)) {
    throw new ApiError(403, "Missing permission to detach documents");
  }

  const legalDoc = await LegalDocument.findOne({
    _id: documentId,
    workspaceId: ctx.workspaceId,
    caseId: caseDoc._id,
    isDeleted: false
  });
  if (!legalDoc) throw new ApiError(404, "Document not found on this case");

  legalDoc.caseId = null;
  await legalDoc.save();

  await writeAudit({
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.userId,
    action: WORKSPACE_AUDIT_ACTIONS.CASE_DOC_DETACHED,
    meta: { caseId: String(caseDoc._id), documentId: String(legalDoc._id) }
  });

  return { caseId: caseDoc._id, documentId: legalDoc._id, detached: true };
}

export async function linkBooking(ctx, caseId, bookingId) {
  const caseDoc = await loadCaseOrThrow(ctx.workspaceId, caseId);
  if (!canEditCase(caseDoc, ctx)) throw new ApiError(403, "Missing permission to edit this case");

  if (bookingId) {
    const booking = await Booking.findOne({
      _id: bookingId,
      deletedByLawyer: { $ne: true }
    }).lean();
    if (!booking) throw new ApiError(404, "Booking not found");

    const member = await Membership.findOne({
      workspaceId: ctx.workspaceId,
      userId: booking.lawyerUserId,
      status: MEMBERSHIP_STATUS.ACTIVE,
      deletedAt: null
    }).lean();
    if (!member) {
      throw new ApiError(400, "Booking lawyer must be an active member of this workspace");
    }
    caseDoc.bookingId = booking._id;
  } else {
    caseDoc.bookingId = null;
  }

  caseDoc.updatedByUserId = ctx.userId;
  await caseDoc.save();

  await writeAudit({
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.userId,
    action: WORKSPACE_AUDIT_ACTIONS.CASE_BOOKING_LINKED,
    meta: { caseId: String(caseDoc._id), bookingId: caseDoc.bookingId }
  });

  return formatCase(caseDoc, { includeNotes: true });
}

/** Validate case exists + user can attach when ingesting with caseId. */
export async function assertCanAttachToCase(ctx, caseId) {
  if (!caseId) return null;
  const caseDoc = await loadCaseOrThrow(ctx.workspaceId, caseId);
  if (!canAttachDocuments(caseDoc, ctx)) {
    throw new ApiError(403, "Missing permission to attach documents to this case");
  }
  return caseDoc;
}

export const CASE_META = {
  statuses: Object.values(CASE_STATUS),
  priorities: Object.values(CASE_PRIORITY),
  types: Object.values(CASE_TYPES),
  visibilities: Object.values(CASE_VISIBILITY),
  scopes: Object.values(CASE_LIST_SCOPES),
  courts: PAKISTANI_COURTS
};
