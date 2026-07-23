import { useAuth } from "../../hooks/useAuth";
import { useLogoutConfirm } from "../../context/LogoutConfirmContext";
import { Avatar } from "../ui";
import { FiLogOut } from "react-icons/fi";

export default function SidebarUserFooter({ onNavigate }) {
  const { user } = useAuth();
  const { requestLogout } = useLogoutConfirm();

  if (!user) return null;

  const handleLogout = () => {
    onNavigate?.();
    requestLogout();
  };

  return (
    <div className="min-w-0 shadow-sm">
      <div className="flex items-center gap-2.5 min-w-0">
        <Avatar user={user} size="sm" showBorder className="shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text-primary truncate m-0 leading-tight">
            {user.fullName || "User"}
          </p>
          <p className="text-xs text-text-muted truncate m-0 mt-0.5">{user.email}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Log out"
          title="Log out"
          className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg text-danger hover:bg-danger/10 transition-colors"
        >
          <FiLogOut size={18} />
        </button>
      </div>
    </div>
  );
}
