import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchRecentNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from "../../store/slices/notificationsSlice";
import { useAuth } from "../../hooks/useAuth";
import { getNotificationsPath } from "../../utils/authRoutes";
import NotificationItem from "./NotificationItem";
import Button from "../ui/Button";
import Spinner from "../ui/Spinner";

export default function NotificationDropdown({ onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { recentItems, recentLoading, unreadCount } = useSelector((state) => state.notifications);
  const viewAllPath = getNotificationsPath(user?.role);

  useEffect(() => {
    dispatch(fetchRecentNotifications());
  }, [dispatch]);

  const handleClick = async (notification) => {
    if (!notification.readAt) {
      await dispatch(markNotificationRead(notification.id));
    }
    onClose?.();
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkAll = async () => {
    await dispatch(markAllNotificationsRead());
    dispatch(fetchRecentNotifications());
  };

  return (
    <div className="w-[min(100vw-2rem,360px)]">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border">
        <div>
          <p className="text-sm font-semibold text-text-primary m-0">Notifications</p>
          {unreadCount > 0 ? (
            <p className="text-xs text-text-muted m-0 mt-0.5">{unreadCount} unread</p>
          ) : null}
        </div>
        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={handleMarkAll}
            className="text-xs text-primary hover:underline"
          >
            Mark all read
          </button>
        ) : null}
      </div>

      <div className="max-h-[360px] overflow-y-auto p-2">
        {recentLoading ? (
          <div className="flex justify-center py-8">
            <Spinner className="w-5 h-5 text-primary" />
          </div>
        ) : recentItems.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-8 m-0">No notifications yet</p>
        ) : (
          <div className="space-y-1">
            {recentItems.map((n) => (
              <NotificationItem key={n.id} notification={n} onClick={handleClick} compact />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border p-2">
        <Link to={viewAllPath} onClick={onClose}>
          <Button variant="secondary" size="sm" fullWidth>
            View all notifications
          </Button>
        </Link>
      </div>
    </div>
  );
}
