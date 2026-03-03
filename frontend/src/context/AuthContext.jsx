/**
 * AuthProvider - Legacy component
 * 
 * @deprecated Authentication bootstrapping is now handled by Gateway component
 * This component is kept for backward compatibility but does nothing
 * 
 * The Gateway component now handles:
 * - Bootstrap authentication
 * - Loading states
 * - App initialization
 */
export function AuthProvider({ children }) {
  // Gateway component now handles bootstrap
  // This is kept for backward compatibility
  return children;
}
