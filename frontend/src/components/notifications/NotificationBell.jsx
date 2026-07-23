import { useState } from "react";
import { FiBell } from "react-icons/fi";
import { useSelector } from "react-redux";
import Popover from "../ui/Popover";
import NotificationDropdown from "./NotificationDropdown";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const unreadCount = useSelector((state) => state.notifications.unreadCount);

  return (
    <Popover
      isOpen={open}
      onToggle={() => setOpen((v) => !v)}
      onClose={() => setOpen(false)}
      placement="bottom-end"
      className="p-0 bg-card border border-border shadow-lg rounded-xl overflow-hidden"
      trigger={
        <button
          type="button"
          className="relative p-2 rounded-lg hover:bg-surface transition-colors text-text-primary"
          aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        >
          <FiBell size={20} />
          {unreadCount > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </button>
      }
    >
      <NotificationDropdown onClose={() => setOpen(false)} />
    </Popover>
  );
}
