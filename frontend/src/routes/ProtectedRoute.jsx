import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

/**
 * ProtectedRoute Component
 * 
 * Protects routes that require authentication
 * - Shows loading state (handled by Gateway)
 * - Redirects to login if not authenticated
 * - Checks role permissions if roles are specified
 */
export default function ProtectedRoute({ roles = [], children }) {
  const { user, loading } = useAuth();

  // Loading is handled by Gateway component
  // But we return null here to avoid flash of content
  if (loading) {
    return null;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role permissions
  if (roles.length > 0 && !roles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    const dashboardMap = {
      CLIENT: "/client/overview",
      LAWYER: "/lawyer/overview",
      ADMIN: "/admin/overview",
    };
    const dashboard = dashboardMap[user.role] || "/";
    return <Navigate to={dashboard} replace />;
  }

  return children;
}
