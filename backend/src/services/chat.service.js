import Message from "../models/Message.js";

export async function listMessages(sessionId, limit = 50) {
  const items = await Message.find({ sessionId }).sort({ createdAt: -1 }).limit(limit).lean();
  return items.reverse();
}

export async function createMessage({ sessionId, senderId, text }) {
  const msg = await Message.create({ sessionId, senderId, text });
  return msg.toObject();
}
