import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { bootstrapAuth } from "../store/slices/authSlice";
import { useAuth } from "../hooks/useAuth";

/**
 * Gateway Component
 * 
 * Central entry point for the application that:
 * - Bootstraps authentication on mount
 * - Handles loading states (auth initialization, profile loading)
 * - Provides a consistent loading UI
 * - Acts as a single source of truth for app initialization
 */
export default function Gateway({ children }) {
  const dispatch = useDispatch();
  const { loading, profileLoading } = useAuth();

  useEffect(() => {
    // Bootstrap auth on mount - check if user is logged in
    dispatch(bootstrapAuth());
  }, [dispatch]);

  // Show loading screen while auth is being initialized
  if (loading) {
    return <LoadingScreen message="Initializing..." />;
  }

  // Show loading screen while profile is being loaded (optional, can be removed if not needed)
  // if (profileLoading && !user) {
  //   return <LoadingScreen message="Loading profile..." />;
  // }

  return children;
}

/**
 * Loading Screen Component
 * Professional loading screen with theme-aware styling
 * Consistent with StateHandler loading UI
 */
function LoadingScreen({ message = "Loading..." }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-2 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-sm text-text-secondary font-medium">{message}</p>
      </div>
    </div>
  );
}

