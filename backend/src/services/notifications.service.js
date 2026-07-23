import Notification from "../models/Notification.js";
import { ApiError } from "../helpers/apiError.js";

export async function listNotifications({ userId, page = 1, limit = 20, unreadOnly = false }) {
  const skip = (page - 1) * limit;
  const filter = { userId };
  if (unreadOnly) filter.readAt = null;

  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId, readAt: null })
  ]);

  return {
    items: items.map(formatNotification),
    unreadCount,
    meta: { page, limit, total, pages: Math.ceil(total / limit) }
  };
}

export async function getUnreadCount(userId) {
  const count = await Notification.countDocuments({ userId, readAt: null });
  return { unreadCount: count };
}

export async function markAsRead({ notificationId, userId }) {
  const notification = await Notification.findOne({ _id: notificationId, userId });
  if (!notification) throw new ApiError(404, "Notification not found");

  if (!notification.readAt) {
    notification.readAt = new Date();
    await notification.save();
  }

  return formatNotification(notification.toObject());
}

export async function markAllAsRead(userId) {
  const result = await Notification.updateMany(
    { userId, readAt: null },
    { $set: { readAt: new Date() } }
  );
  return { modifiedCount: result.modifiedCount };
}

function formatNotification(doc) {
  return {
    id: doc._id.toString(),
    type: doc.type,
    title: doc.title,
    body: doc.body,
    link: doc.link,
    readAt: doc.readAt,
    metadata: doc.metadata || {},
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}
