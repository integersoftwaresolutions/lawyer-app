import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function socketAuth(io) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Missing token"));

      const payload = jwt.verify(token, env.jwtAccessSecret);
      socket.user = { id: payload.sub, role: payload.role };
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });
}
