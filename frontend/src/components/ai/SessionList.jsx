import { FiPlus, FiTrash2, FiMessageCircle } from "react-icons/fi";

function formatRelativeTime(value) {
  if (!value) return "";
  const date = new Date(value);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.round((startOfToday - startOfDate) / (1000 * 60 * 60 * 24));

  if (dayDiff === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (dayDiff === 1) return "Yesterday";
  if (dayDiff < 7) {
    return date.toLocaleDateString([], { weekday: "short" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function SessionSkeleton() {
  return (
    <div className="space-y-1 p-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-14 rounded-lg bg-surface animate-pulse" />
      ))}
    </div>
  );
}

export default function SessionList({
  sessions = [],
  activeSessionId,
  loading = false,
  onSelect,
  onNewChat,
  onDelete,
  compact = false
}) {
  return (
    <div className={`flex flex-col h-full min-h-0 bg-surface ${compact ? "" : ""}`}>
      <div className="shrink-0 p-3 border-b border-card-border">
        <button
          type="button"
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-card-border bg-card text-sm font-medium text-text-primary hover:bg-surface-hover transition-colors"
        >
          <FiPlus className="w-4 h-4" />
          New chat
        </button>
      </div>

      <div className="shrink-0 px-4 pt-3 pb-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          Recent
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-2">
        {loading ? (
          <SessionSkeleton />
        ) : sessions.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <FiMessageCircle className="w-8 h-8 mx-auto text-text-muted mb-2 opacity-50" />
            <p className="text-sm text-text-secondary">No conversations yet</p>
            <p className="text-xs text-text-muted mt-1">Start a new chat to begin research</p>
          </div>
        ) : (
          <ul className="space-y-0.5">
            {sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              return (
                <li key={session.id}>
                  <div
                    className={`group relative flex items-center rounded-lg transition-colors ${
                      isActive
                        ? "bg-surface-hover text-text"
                        : "hover:bg-surface-hover text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(session.id)}
                      className="flex-1 min-w-0 text-left py-2.5 pl-3 pr-8"
                    >
                      <p
                        className={`text-sm truncate ${
                          isActive ? "font-medium text-text-primary" : "font-normal"
                        }`}
                      >
                        {session.title || "New conversation"}
                      </p>
                      <p className="text-[11px] text-text-muted mt-0.5 truncate">
                        {formatRelativeTime(session.updatedAt)}
                        {session.messageCount > 0 && ` · ${session.messageCount} messages`}
                      </p>
                    </button>
                    {onDelete && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(session.id);
                        }}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-text-muted opacity-0 group-hover:opacity-100 hover:text-danger hover:bg-danger-light transition-all"
                        aria-label="Delete conversation"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
