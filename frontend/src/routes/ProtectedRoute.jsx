import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

/**
 * Protects routes that require authentication
 * - Redirects to login if not authenticated
 * - Redirects unverified users to verify-email
 * - Checks role permissions if roles are specified
 */
export default function ProtectedRoute({ roles = [], children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.isEmailVerified) {
    return (
      <Navigate
        to={`/verify-email?email=${encodeURIComponent(user.email)}&from=login`}
        replace
      />
    );
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    const dashboardMap = {
      CLIENT: "/client/overview",
      LAWYER: "/lawyer/overview",
      ADMIN: "/admin/overview"
    };
    const dashboard = dashboardMap[user.role] || "/";
    return <Navigate to={dashboard} replace />;
  }

  return children;
}
