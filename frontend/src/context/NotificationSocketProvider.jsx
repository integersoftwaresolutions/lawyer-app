import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createSocket } from "../services/socket";
import { SOCKET_EVENTS } from "../config/socket.events";
import {
  addRealtimeNotification,
  fetchUnreadCount,
  clearNotifications
} from "../store/slices/notificationsSlice";
import { useToast } from "../hooks/useToast";
import { storage } from "../utils/storage";

export default function NotificationSocketProvider({ children }) {
  const dispatch = useDispatch();
  const toast = useToast();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const accessToken = useSelector((state) => state.auth.accessToken);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      dispatch(clearNotifications());
      return;
    }

    dispatch(fetchUnreadCount());

    const socket = createSocket();
    socketRef.current = socket;
    socket.auth = { token: storage.getAccessToken() };
    socket.connect();

    const onNotification = (payload) => {
      dispatch(addRealtimeNotification(payload));
      toast.info(payload.title || payload.body || "New notification");
    };

    socket.on(SOCKET_EVENTS.NOTIFICATION_NEW, onNotification);

    return () => {
      socket.off(SOCKET_EVENTS.NOTIFICATION_NEW, onNotification);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, accessToken, dispatch, toast]);

  return children;
}
