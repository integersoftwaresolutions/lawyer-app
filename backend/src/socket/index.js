import { Server } from "socket.io";
import { socketAuth } from "./auth.socket.js";
import { chatSocket } from "./chat.socket.js";
import { videoSocket } from "./video.socket.js";
import { notificationSocket } from "./notification.socket.js";
import { env } from "../config/env.js";

let ioInstance = null;

export function getSocketIo() {
  return ioInstance;
}

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.clientOrigin,
      credentials: true
    }
  });

  ioInstance = io;

  socketAuth(io);
  notificationSocket(io);
  chatSocket(io);
  videoSocket(io);

  return io;
}
