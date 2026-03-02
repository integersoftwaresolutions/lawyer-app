import { Server } from "socket.io";
import { socketAuth } from "./auth.socket.js";
import { chatSocket } from "./chat.socket.js";
import { env } from "../config/env.js";

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.clientOrigin,
      credentials: true
    }
  });

  socketAuth(io);
  chatSocket(io);

  return io;
}
