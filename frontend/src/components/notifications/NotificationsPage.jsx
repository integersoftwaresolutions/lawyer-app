import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FiBell } from "react-icons/fi";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from "../../store/slices/notificationsSlice";
import PageShell from "../ui/PageShell";
import PageHeader from "../ui/PageHeader";
import Button from "../ui/Button";
import Pagination from "../ui/Pagination";
import NotificationItem from "./NotificationItem";

export default function NotificationsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, meta, pageLoading, unreadCount } = useSelector((state) => state.notifications);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(
      fetchNotifications({
        page,
        limit: 20,
        unreadOnly: filter === "unread"
      })
    );
  }, [dispatch, page, filter]);

  const handleClick = async (notification) => {
    if (!notification.readAt) {
      await dispatch(markNotificationRead(notification.id));
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkAll = async () => {
    await dispatch(markAllNotificationsRead());
    dispatch(fetchNotifications({ page: 1, limit: 20, unreadOnly: filter === "unread" }));
  };

  return (
    <PageShell>
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
        icon={FiBell}
        actions={
          unreadCount > 0 ? (
            <Button variant="secondary" size="sm" onClick={handleMarkAll}>
              Mark all as read
            </Button>
          ) : null
        }
      />

      <div className="flex gap-2 mb-4">
        <Button
          variant={filter === "all" ? "primary" : "secondary"}
          size="sm"
          onClick={() => {
            setFilter("all");
            setPage(1);
          }}
        >
          All
        </Button>
        <Button
          variant={filter === "unread" ? "primary" : "secondary"}
          size="sm"
          onClick={() => {
            setFilter("unread");
            setPage(1);
          }}
        >
          Unread
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {pageLoading ? (
          <p className="text-sm text-text-muted text-center py-12 m-0">Loading notifications...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-12 m-0">
            {filter === "unread" ? "No unread notifications" : "No notifications yet"}
          </p>
        ) : (
          <div className="divide-y divide-border">
            {items.map((n) => (
              <div key={n.id} className="p-2">
                <NotificationItem notification={n} onClick={handleClick} />
              </div>
            ))}
          </div>
        )}
      </div>

      {meta.pages > 1 ? (
        <div className="mt-4 flex justify-center">
          <Pagination
            currentPage={meta.page}
            totalPages={meta.pages}
            totalItems={meta.total}
            itemsPerPage={meta.limit}
            onPageChange={setPage}
          />
        </div>
      ) : null}
    </PageShell>
  );
}
