/**
 * Extract error message from API error response
 * Handles consistent error response format from backend
 */
export function getErrorMessage(error) {
  if (!error) return "An unexpected error occurred";

  if (error.code === "SESSION_EXPIRED") {
    return "Your session has expired. Please sign in again.";
  }
  if (error.code === "AUTH_UNAVAILABLE") {
    return (
      error.message ||
      "Can't reach the server. Check your connection and try again."
    );
  }

  // Check for response data with message
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // Check for response data with errors object
  if (error.response?.data?.errors) {
    const errors = error.response.data.errors;
    if (typeof errors === "string") return errors;
    if (Array.isArray(errors) && errors.length > 0) {
      return errors[0];
    }
    if (typeof errors === "object") {
      const firstError = Object.values(errors)[0];
      if (Array.isArray(firstError)) return firstError[0];
      return firstError;
    }
  }

  // Check for error message
  if (error.message) return error.message;

  // Default message based on status
  const status = error.response?.status;
  if (status === 401) return "Unauthorized. Please login again.";
  if (status === 403) return "You don't have permission to perform this action.";
  if (status === 404) return "Resource not found.";
  if (status === 409) return "Conflict. This resource already exists.";
  if (status === 422) return "Validation error. Please check your input.";
  if (status >= 500) return "Server error. Please try again later.";

  return "An unexpected error occurred";
}

/**
 * Handle API error with toast notification
 * @param {Error} error - The error object
 * @param {Function} toast - Toast function from useToast hook
 * @param {Object} options - Options for error handling
 */
export function handleApiError(error, toast, options = {}) {
  const { 
    showToast = true, 
    fallbackMessage = null,
    onError = null 
  } = options;
  
  const message = fallbackMessage || getErrorMessage(error);
  
  if (showToast && toast) {
    toast.error(message);
  }
  
  if (onError) {
    onError(error, message);
  }
  
  return message;
}

