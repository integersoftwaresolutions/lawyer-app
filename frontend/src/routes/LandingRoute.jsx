import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getDashboardPath } from "../utils/authRoutes";

/**
 * Marketing/landing is public.
 * Verified signed-in users go to their dashboard.
 * Unverified users stay here so they can leave the OTP screen.
 */
export default function LandingRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user?.isEmailVerified) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return children;
}
