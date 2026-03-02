import { SOCKET_EVENTS } from "./events.js";
import Booking from "../models/Booking.js";
import Session from "../models/Session.js";
import { createMessage, listMessages } from "../services/chat.service.js";

export function chatSocket(io) {
  io.on("connection", (socket) => {
    socket.on(SOCKET_EVENTS.JOIN_SESSION, async ({ bookingId }) => {
      try {
        const booking = await Booking.findById(bookingId);
        if (!booking) return socket.emit(SOCKET_EVENTS.ERROR, { message: "Booking not found" });

        const isParticipant =
          booking.clientId.toString() === socket.user.id ||
          booking.lawyerUserId.toString() === socket.user.id;

        if (!isParticipant) return socket.emit(SOCKET_EVENTS.ERROR, { message: "Not allowed" });

        const session = await Session.findOne({ bookingId });
        if (!session) return socket.emit(SOCKET_EVENTS.ERROR, { message: "Session not found" });

        const room = `session:${session._id.toString()}`;
        socket.join(room);

        const history = await listMessages(session._id.toString(), 50);
        socket.emit("chat:history", { sessionId: session._id.toString(), items: history });
      } catch (e) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: e.message || "Join error" });
      }
    });

    socket.on(SOCKET_EVENTS.SEND_MESSAGE, async ({ sessionId, text }) => {
      try {
        if (!text || !text.trim()) return;

        const msg = await createMessage({ sessionId, senderId: socket.user.id, text: text.trim() });
        const room = `session:${sessionId}`;
        io.to(room).emit(SOCKET_EVENTS.NEW_MESSAGE, msg);
      } catch (e) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: e.message || "Send error" });
      }
    });
  });
}
