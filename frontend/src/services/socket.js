import { io } from "socket.io-client";
import { storage } from "../utils/storage";

export function createSocket() {
  return io(import.meta.env.VITE_SOCKET_URL, {
    autoConnect: false,
    auth: { token: storage.getAccessToken() }
  });
}
