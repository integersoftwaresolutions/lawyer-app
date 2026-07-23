import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getDashboardPath } from "../utils/authRoutes";

/**
 * The landing page is an entry point for signed-out users.
 * Authenticated users go directly to their role-specific destination.
 */
export default function LandingRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    if (!user.isEmailVerified) {
      return (
        <Navigate
          to={`/verify-email?email=${encodeURIComponent(user.email)}&from=login`}
          replace
        />
      );
    }

    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return children;
}
