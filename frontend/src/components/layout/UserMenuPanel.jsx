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
        <div className="flex items-center gap-2 mt-1">
          <div className="text-xs text-text-secondary truncate">{user.email}</div>
          {user.isEmailVerified ? (
            <span className="shrink-0 text-[10px] font-medium text-success">Verified</span>
          ) : (
            <span className="shrink-0 text-[10px] font-medium text-warning">Unverified</span>
          )}
        </div>
      </div>
      <div className="py-1">
        {user.isEmailVerified ? (
          <>
            <Link to={getDashboardPath(user.role)} onClick={close} className={linkClass}>
              Dashboard
            </Link>
            {user.role === "CLIENT" ? (
              <Link to="/lawyers" onClick={close} className={linkClass}>
                Book a lawyer
              </Link>
            ) : null}
            {user.role === "LAWYER" ? (
              <>
                <Link to="/lawyer/billing/subscription" onClick={close} className={linkClass}>
                  Billing
                </Link>
                <Link to="/pricing" onClick={close} className={linkClass}>
                  Pricing
                </Link>
              </>
            ) : null}
            <Link to={getProfilePath(user.role)} onClick={close} className={linkClass}>
              Account settings
            </Link>
          </>
        ) : (
          <>
            <Link
              to={`/verify-email?email=${encodeURIComponent(user.email)}`}
              onClick={close}
              className={linkClass}
            >
              Verify email
            </Link>
            <Link to="/pricing" onClick={close} className={linkClass}>
              Pricing
            </Link>
          </>
        )}
        <Link to="/request-feature" onClick={close} className={linkClass}>
          Request a feature
        </Link>
        <button type="button" onClick={handleLogout} className={logoutClass}>
          Logout
        </button>
      </div>
    </>
  );
}
