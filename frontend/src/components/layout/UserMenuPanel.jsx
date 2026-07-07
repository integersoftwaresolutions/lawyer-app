import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useLogoutConfirm } from "../../context/LogoutConfirmContext";
import { getDashboardPath, getProfilePath } from "../../utils/authRoutes";

const linkClass =
  "block px-4 py-2 text-sm text-text-primary hover:bg-surface-hover transition-colors rounded";
const logoutClass =
  "w-full text-left px-4 py-2 text-sm text-danger hover:bg-surface-hover transition-colors rounded";

export default function UserMenuPanel({ onNavigate }) {
  const { user } = useAuth();
  const { requestLogout } = useLogoutConfirm();

  if (!user) return null;

  const close = () => onNavigate?.();

  const handleLogout = () => {
    close();
    requestLogout();
  };

  return (
    <>
      <div className="px-4 py-3 border-b border-border">
        <div className="font-semibold text-text-primary text-sm truncate">
          {user.fullName || "User"}
        </div>
        <div className="text-xs text-text-secondary mt-1 truncate">{user.email}</div>
      </div>
      <div className="py-1">
        <Link to={getDashboardPath(user.role)} onClick={close} className={linkClass}>
          Dashboard
        </Link>
        <Link to={getProfilePath(user.role)} onClick={close} className={linkClass}>
          Profile
        </Link>
        <button type="button" onClick={handleLogout} className={logoutClass}>
          Logout
        </button>
      </div>
    </>
  );
}
