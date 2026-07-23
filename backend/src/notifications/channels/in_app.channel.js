import Notification from "../../models/Notification.js";
import { getInAppContent } from "../in-app.registry.js";
import { getSocketIo } from "../../socket/index.js";
import { SOCKET_EVENTS } from "../../config/socket.events.js";

function toClientNotification(doc) {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: obj._id.toString(),
    type: obj.type,
    title: obj.title,
    body: obj.body,
    link: obj.link,
    readAt: obj.readAt,
    metadata: obj.metadata || {},
    createdAt: obj.createdAt
  };
}

export async function sendInAppNotification({ type, userId, variables = {}, metadata = {} }) {
  const content = getInAppContent(type, variables);
  if (!content) {
    throw new Error(`No in-app content for notification type: ${type}`);
  }

  const notification = await Notification.create({
    userId,
    type,
    title: content.title,
    body: content.body,
    link: content.link,
    metadata
  });

  const payload = toClientNotification(notification);

  const io = getSocketIo();
  if (io) {
    io.to(`user:${userId}`).emit(SOCKET_EVENTS.NOTIFICATION_NEW, payload);
  }

  return payload;
}
