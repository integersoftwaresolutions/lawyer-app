import { SOCKET_EVENTS } from "./events.js";
import Booking from "../models/Booking.js";
import Session from "../models/Session.js";
import { BOOKING_STATUS } from "../config/constants.js";

export function videoSocket(io) {
  io.on("connection", (socket) => {
    const validateVideoAccess = async (sessionId) => {
      const session = await Session.findById(sessionId);
      if (!session) return { ok: false, error: "Session not found" };
      if (!session.allowVideo) return { ok: false, error: "Video not allowed for this session" };
      if (session.status !== BOOKING_STATUS.ACTIVE) return { ok: false, error: "Session not active" };

      const booking = await Booking.findById(session.bookingId);
      if (!booking) return { ok: false, error: "Booking not found" };
      const isParticipant =
        booking.clientId.toString() === socket.user.id ||
        booking.lawyerUserId.toString() === socket.user.id;
      if (!isParticipant) return { ok: false, error: "Not allowed" };

      return { ok: true };
    };

    const getRoom = (sessionId) => `session:${sessionId}`;

    const ensureInRoom = (sessionId) => {
      const room = getRoom(sessionId);
      if (!socket.rooms.has(room)) return false;
      return true;
    };

    socket.on(SOCKET_EVENTS.VIDEO_OFFER, async ({ sessionId, offer }) => {
      try {
        if (!ensureInRoom(sessionId)) return socket.emit(SOCKET_EVENTS.ERROR, { message: "Join session first" });
        const valid = await validateVideoAccess(sessionId);
        if (!valid.ok) return socket.emit(SOCKET_EVENTS.ERROR, { message: valid.error });

        const room = getRoom(sessionId);
        socket.to(room).emit(SOCKET_EVENTS.VIDEO_OFFER, { sessionId, offer, from: socket.user.id });
      } catch (e) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: e.message || "Video offer error" });
      }
    });

    socket.on(SOCKET_EVENTS.VIDEO_ANSWER, async ({ sessionId, answer }) => {
      try {
        if (!ensureInRoom(sessionId)) return socket.emit(SOCKET_EVENTS.ERROR, { message: "Join session first" });
        const valid = await validateVideoAccess(sessionId);
        if (!valid.ok) return socket.emit(SOCKET_EVENTS.ERROR, { message: valid.error });

        const room = getRoom(sessionId);
        socket.to(room).emit(SOCKET_EVENTS.VIDEO_ANSWER, { sessionId, answer, from: socket.user.id });
      } catch (e) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: e.message || "Video answer error" });
      }
    });

    socket.on(SOCKET_EVENTS.VIDEO_ICE, async ({ sessionId, candidate }) => {
      try {
        if (!ensureInRoom(sessionId)) return socket.emit(SOCKET_EVENTS.ERROR, { message: "Join session first" });
        const valid = await validateVideoAccess(sessionId);
        if (!valid.ok) return socket.emit(SOCKET_EVENTS.ERROR, { message: valid.error });

        const room = getRoom(sessionId);
        socket.to(room).emit(SOCKET_EVENTS.VIDEO_ICE, { sessionId, candidate, from: socket.user.id });
      } catch (e) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: e.message || "Video ICE error" });
      }
    });

    socket.on(SOCKET_EVENTS.VIDEO_END, async ({ sessionId }) => {
      try {
        if (!ensureInRoom(sessionId)) return socket.emit(SOCKET_EVENTS.ERROR, { message: "Join session first" });
        const valid = await validateVideoAccess(sessionId);
        if (!valid.ok) return socket.emit(SOCKET_EVENTS.ERROR, { message: valid.error });

        const room = getRoom(sessionId);
        socket.to(room).emit(SOCKET_EVENTS.VIDEO_END, { sessionId, from: socket.user.id });
      } catch (e) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: e.message || "Video end error" });
      }
    });
  });
}
