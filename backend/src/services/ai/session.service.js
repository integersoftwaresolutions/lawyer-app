import { ApiError } from "../../helpers/apiError.js";
import AiSession from "../../models/AiSession.js";
import AiMessage from "../../models/AiMessage.js";
import { AI_MODES } from "../../config/constants.js";
import { getModeStrategy } from "./modes/index.js";
import { getPagination, buildPaginationMeta } from "../../utils/pagination.js";

export function deriveTitle(text) {
  const cleaned = String(text).replace(/\s+/g, " ").trim();
  if (!cleaned) return "New conversation";
  return cleaned.length > 60 ? `${cleaned.slice(0, 57)}...` : cleaned;
}

export async function createSession({ lawyerId, mode = AI_MODES.RESEARCH, title, caseRef = "", metadata = {} }) {
  const strategy = getModeStrategy(mode);

  const session = await AiSession.create({
    lawyerId,
    mode: strategy.mode,
    title: title?.trim() || "New conversation",
    caseRef: caseRef?.trim() || "",
    metadata
  });

  return formatSession(session);
}

export async function getOwnedSession(sessionId, lawyerId) {
  const session = await AiSession.findOne({ _id: sessionId, isDeleted: false });
  if (!session) throw new ApiError(404, "Session not found");
  if (String(session.lawyerId) !== String(lawyerId)) {
    throw new ApiError(403, "You do not have access to this session");
  }
  return session;
}

export async function listSessions(lawyerId, query = {}) {
  const { page, limit, skip } = getPagination(query);
  const filter = { lawyerId, isDeleted: false };

  if (query.mode) filter.mode = query.mode;

  const [total, sessions] = await Promise.all([
    AiSession.countDocuments(filter),
    AiSession.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean()
  ]);

  const sessionIds = sessions.map((s) => s._id);
  const counts = sessionIds.length
    ? await AiMessage.aggregate([
        { $match: { sessionId: { $in: sessionIds } } },
        { $group: { _id: "$sessionId", messageCount: { $sum: 1 } } }
      ])
    : [];

  const countMap = new Map(counts.map((c) => [String(c._id), c.messageCount]));

  return {
    items: sessions.map((s) => ({
      ...formatSession(s),
      messageCount: countMap.get(String(s._id)) || 0
    })),
    meta: buildPaginationMeta(total, { page, limit })
  };
}

export async function deleteSession(sessionId, lawyerId) {
  const session = await getOwnedSession(sessionId, lawyerId);
  session.isDeleted = true;
  await session.save();
  return { id: session._id };
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
    title: doc.title,
    mode: doc.mode,
    caseRef: doc.caseRef,
    metadata: doc.metadata,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}
