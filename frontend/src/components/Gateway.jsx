import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { bootstrapAuth } from "../store/slices/authSlice";
import { useAuth } from "../hooks/useAuth";
import { FiLoader } from "react-icons/fi";

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
 */
function LoadingScreen({ message = "Loading..." }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="relative inline-block">
          <FiLoader className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
        </div>
        <p className="text-text-secondary text-sm font-medium mt-4">{message}</p>
        <div className="flex justify-center gap-1 mt-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}

