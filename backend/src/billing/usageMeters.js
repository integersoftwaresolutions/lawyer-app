import Case from "../models/Case.js";
import LegalDocument from "../models/LegalDocument.js";
import Media from "../models/Media.js";
import Membership from "../models/Membership.js";
import AiUsageLog from "../models/AiUsageLog.js";
import { MEMBERSHIP_STATUS } from "../config/constants.js";
import { LIMIT_KEYS } from "./planCatalog.js";

function utcMonthRange(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));
  return { start, end };
}

export async function countActiveCases(workspaceId) {
  return Case.countDocuments({
    workspaceId,
    isDeleted: false,
    isArchived: false,
    status: { $ne: "ARCHIVED" }
  });
}

export async function countDocuments(workspaceId) {
  return LegalDocument.countDocuments({
    workspaceId,
    isDeleted: false
  });
}

export async function sumDocumentStorageMb(workspaceId) {
  const docs = await LegalDocument.find({
    workspaceId,
    isDeleted: false,
    mediaId: { $ne: null }
  })
    .select("mediaId")
    .lean();

  const mediaIds = docs.map((d) => d.mediaId).filter(Boolean);
  if (!mediaIds.length) return 0;

  const medias = await Media.find({ _id: { $in: mediaIds }, isActive: true })
    .select("fileSize")
    .lean();

  const bytes = medias.reduce((sum, m) => sum + (m.fileSize || 0), 0);
  return Math.ceil(bytes / (1024 * 1024));
}

export async function countActiveMembers(workspaceId) {
  return Membership.countDocuments({
    workspaceId,
    status: MEMBERSHIP_STATUS.ACTIVE,
    deletedAt: null
  });
}

/**
 * Workspace AI messages this UTC calendar month.
 * Prefer metadata.workspaceId on AiUsageLog; fall back not available for old rows.
 */
export async function countAiMessagesThisMonth(workspaceId) {
  const { start, end } = utcMonthRange();
  return AiUsageLog.countDocuments({
    createdAt: { $gte: start, $lt: end },
    "metadata.workspaceId": String(workspaceId),
    type: "CHAT_COMPLETION"
  });
}

export async function getUsageSnapshot(workspaceId) {
  const [casesActive, docsCount, storageMb, seatsUsed, aiMessages] = await Promise.all([
    countActiveCases(workspaceId),
    countDocuments(workspaceId),
    sumDocumentStorageMb(workspaceId),
    countActiveMembers(workspaceId),
    countAiMessagesThisMonth(workspaceId)
  ]);

  return {
    [LIMIT_KEYS.CASES_ACTIVE]: casesActive,
    [LIMIT_KEYS.DOCS_COUNT]: docsCount,
    [LIMIT_KEYS.DOCS_STORAGE_MB]: storageMb,
    [LIMIT_KEYS.SEATS]: seatsUsed,
    [LIMIT_KEYS.AI_MESSAGES_PER_MONTH]: aiMessages
  };
}
