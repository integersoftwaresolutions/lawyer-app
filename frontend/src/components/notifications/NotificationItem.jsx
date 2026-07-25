function formatTimeAgo(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function NotificationItem({ notification, onClick, compact = false }) {
  const isUnread = !notification.readAt;

  return (
    <button
      type="button"
      onClick={() => onClick?.(notification)}
      className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors hover:bg-surface-hover ${
        isUnread ? "bg-primary-light" : ""
      } ${compact ? "" : "border border-transparent hover:border-border"}`}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <span
          className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
            isUnread ? "bg-primary" : "bg-transparent"
          }`}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className={`text-sm m-0 truncate ${isUnread ? "font-semibold text-text-primary" : "font-medium text-text-primary"}`}>
            {notification.title}
          </p>
          <p className="text-xs text-text-secondary mt-0.5 mb-0 line-clamp-2">{notification.body}</p>
          <p className="text-[11px] text-text-muted mt-1 mb-0">{formatTimeAgo(notification.createdAt)}</p>
        </div>
      </div>
    </button>
  );
}

export { formatTimeAgo };
