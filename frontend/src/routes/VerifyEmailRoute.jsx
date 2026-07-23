import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

/**
 * Allows access to verify-email when:
 * - User is not logged in (post-registration flow)
 * - User is logged in but email is not yet verified
 * Redirects verified users to their dashboard.
 */
export default function VerifyEmailRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user?.isEmailVerified) {
    const dashboardMap = {
      CLIENT: "/client/overview",
      LAWYER: "/lawyer/overview",
      ADMIN: "/admin/overview"
    };
    return <Navigate to={dashboardMap[user.role] || "/"} replace />;
  }

  return children;
}
