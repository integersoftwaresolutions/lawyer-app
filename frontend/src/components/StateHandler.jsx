import { getErrorMessage } from "../utils/errorHandler";
import { isLawyerNotVerifiedError } from "../utils/lawyerVerification";
import Button from "./ui/Button";
import VerificationRequiredPanel from "./verification/VerificationRequiredPanel";

/**
 * Universal state management wrapper for API-driven UI sections
 * Handles loading, error, retry, and success rendering
 * 
 * @param {Object} props
 * @param {boolean} props.loading - Loading state
 * @param {Error|null} props.error - Error object
 * @param {Function} props.retry - Retry function
 * @param {React.ReactNode} props.children - Content to render on success
 * @param {React.ReactNode} props.loader - Optional custom loader component
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.loaderProps - Props to pass to default loader
 * @param {Object} props.errorProps - Props to pass to error UI
 */
export default function StateHandler({
  loading,
  error,
  retry,
  children,
  loader = null,
  className = "",
  loaderProps = {},
  errorProps = {},
}) {
  // Loading state
  if (loading) {
    if (loader) {
      return <div className={className}>{loader}</div>;
    }
    return <DefaultLoader className={className} {...loaderProps} />;
  }

  // Error state
  if (error) {
    return (
      <ErrorState
        error={error}
        onRetry={retry}
        className={className}
        {...errorProps}
      />
    );
  }

  // Success state - render children
  return <div className={className}>{children}</div>;
}

/**
 * Default loading UI
 */
function DefaultLoader({ className = "", size = "md", ...props }) {
  const sizeClasses = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div className={`flex items-center justify-center ${sizeClasses[size]} ${className}`} {...props}>
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-8 h-8">
          <div className="absolute inset-0 border-2 border-primary-light rounded-full"></div>
          <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-sm text-text-secondary">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Error state UI with retry button
 */
function ErrorState({ error, onRetry, className = "", ...props }) {
  if (isLawyerNotVerifiedError(error)) {
    return (
      <div className={className} {...props}>
        <VerificationRequiredPanel compact />
      </div>
    );
  }

  const errorMessage = getErrorMessage(error);

  return (
    <div className={`flex flex-col items-center justify-center p-6 ${className}`} {...props}>
      <div className="text-center max-w-md">
        <div className="mb-4">
          <svg
            className="w-12 h-12 mx-auto text-danger"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          Something went wrong
        </h3>
        <p className="text-sm text-text-secondary mb-4">{errorMessage}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="primary">
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}

