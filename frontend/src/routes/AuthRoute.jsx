import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

/**
 * Protects login/register from users who already have a verified session.
 * Unverified users are sent back to OTP — they can Sign out from that page.
 */
export default function AuthRoute({ children }) {
  const { user, loading } = useAuth();

  // Show nothing while loading (Gateway handles the loading screen)
  if (loading) {
    return null;
  }

  // Authenticated users should not access login/register
  if (user) {
    if (!user.isEmailVerified) {
      return (
        <Navigate
          to={`/verify-email?email=${encodeURIComponent(user.email)}&from=login`}
          replace
        />
      );
    }

    const dashboardMap = {
      CLIENT: "/client/overview",
      LAWYER: "/lawyer/overview",
      ADMIN: "/admin/overview"
    };
    const dashboard = dashboardMap[user.role] || "/";
    return <Navigate to={dashboard} replace />;
  }

  // User is not authenticated, allow access to auth pages
  return children;
}

