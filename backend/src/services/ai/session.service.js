import { ApiError } from "../../helpers/apiError.js";
import AiSession from "../../models/AiSession.js";
import AiMessage from "../../models/AiMessage.js";
import { AI_MODES } from "../../config/constants.js";
import { getModeStrategy } from "./modes/index.js";
import { listResult } from "../../utils/pagination.js";
import { parseListQuery } from "../../utils/listQuery.js";

export function deriveTitle(text) {
  const cleaned = String(text).replace(/\s+/g, " ").trim();
  if (!cleaned) return "New conversation";
  return cleaned.length > 60 ? `${cleaned.slice(0, 57)}...` : cleaned;
}

export async function createSession({
  lawyerId,
  workspaceId,
  mode = AI_MODES.RESEARCH,
  title,
  caseRef = "",
  metadata = {}
}) {
  if (!workspaceId) throw new ApiError(400, "workspaceId is required");
  const strategy = getModeStrategy(mode);

  const session = await AiSession.create({
    lawyerId,
    workspaceId,
    mode: strategy.mode,
    title: title?.trim() || "New conversation",
    caseRef: caseRef?.trim() || "",
    metadata
  });

  return formatSession(session);
}

export async function getOwnedSession(sessionId, lawyerId, workspaceId = null) {
  const session = await AiSession.findOne({ _id: sessionId, isDeleted: false });
  if (!session) throw new ApiError(404, "Session not found");
  if (String(session.lawyerId) !== String(lawyerId)) {
    throw new ApiError(403, "You do not have access to this session");
  }
  if (workspaceId && String(session.workspaceId) !== String(workspaceId)) {
    throw new ApiError(403, "Session belongs to a different workspace");
  }
  return session;
}

export async function listSessions(lawyerId, query = {}, workspaceId = null) {
  const { filter, sort, pagination } = parseListQuery(query, {
    baseFilter: {
      lawyerId,
      isDeleted: false,
      ...(workspaceId ? { workspaceId } : {})
    },
    filters: [{ key: "mode", path: "mode", type: "eq" }],
    sort: { default: { updatedAt: -1 } }
  });

  const [total, sessions] = await Promise.all([
    AiSession.countDocuments(filter),
    AiSession.find(filter).sort(sort).skip(pagination.skip).limit(pagination.limit).lean()
  ]);

  const sessionIds = sessions.map((s) => s._id);
  const counts = sessionIds.length
    ? await AiMessage.aggregate([
        { $match: { sessionId: { $in: sessionIds } } },
        { $group: { _id: "$sessionId", messageCount: { $sum: 1 } } }
      ])
    : [];

  const countMap = new Map(counts.map((c) => [String(c._id), c.messageCount]));

  return listResult({
    items: sessions.map((s) => ({
      ...formatSession(s),
      messageCount: countMap.get(String(s._id)) || 0
    })),
    total,
    pagination
  });
}

export async function deleteSession(sessionId, lawyerId, workspaceId = null) {
  const session = await getOwnedSession(sessionId, lawyerId, workspaceId);
  session.isDeleted = true;
  await session.save();
  return { id: session._id };
}

export async function updateSessionMetadata(sessionId, lawyerId, updates = {}, workspaceId = null) {
  const session = await getOwnedSession(sessionId, lawyerId, workspaceId);

  if (typeof updates.title === "string" && updates.title.trim()) {
    session.title = updates.title.trim().slice(0, 200);
  }
  if (typeof updates.caseRef === "string") {
    session.caseRef = updates.caseRef.trim().slice(0, 200);
  }
  if (updates.metadata && typeof updates.metadata === "object") {
    session.metadata = {
      ...(session.metadata || {}),
      ...updates.metadata
    };
    session.markModified("metadata");
  }

  await session.save();
  return formatSession(session);
}

export async function updateSessionTitle(session, content) {
  if (!session.title || session.title === "New conversation") {
    session.title = deriveTitle(content);
    await session.save();
  }
}

function formatSession(session) {
  const doc = session.toObject ? session.toObject() : session;
  return {
    id: doc._id,
    lawyerId: doc.lawyerId,
    workspaceId: doc.workspaceId,
    title: doc.title,
    mode: doc.mode,
    caseRef: doc.caseRef,
    metadata: doc.metadata,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}
