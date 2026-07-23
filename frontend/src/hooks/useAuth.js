import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  loginUser, 
  registerUser, 
  logoutUser, 
  refreshUser, 
  clearError,
  fetchUserProfile,
  updateUserProfile,
  markEmailVerified
} from "../store/slices/authSlice";

/**
 * Centralized auth hook - Single source of truth for ALL user data
 * Returns auth state + profile data in one unified user object
 */
export function useAuth() {
  const dispatch = useDispatch();
  const { 
    user,           // Complete user object (includes profile data)
    loading,        // Auth loading (login, register, bootstrap)
    profileLoading, // Profile loading (fetch/update profile)
    error, 
    isAuthenticated, 
    accessToken 
  } = useSelector((state) => state.auth);

  const toErrorLike = useCallback((payload, fallbackMessage) => {
    if (payload?.response || payload instanceof Error) return payload;
    if (typeof payload === "string") {
      return {
        message: payload,
        response: { data: { message: payload } }
      };
    }
    const message = payload?.message || fallbackMessage;
    return {
      message,
      response: {
        status: payload?.status,
        data: {
          message,
          errors: payload?.errors
        }
      }
    };
  }, []);

  const login = useCallback(async (payload) => {
    const result = await dispatch(loginUser(payload));
    if (loginUser.fulfilled.match(result)) {
      return { data: { user: result.payload.user, accessToken: result.payload.accessToken } };
    }
    throw toErrorLike(result.payload, "Login failed");
  }, [dispatch, toErrorLike]);

  const register = useCallback(async (payload) => {
    const result = await dispatch(registerUser(payload));
    if (registerUser.fulfilled.match(result)) {
      return result.payload;
    }
    throw toErrorLike(result.payload, "Registration failed");
  }, [dispatch, toErrorLike]);

  const markVerified = useCallback(() => {
    dispatch(markEmailVerified());
  }, [dispatch]);

  const logout = useCallback(async () => {
    await dispatch(logoutUser());
  }, [dispatch]);

  const refreshUserData = useCallback(async () => {
    const result = await dispatch(refreshUser());
    if (refreshUser.fulfilled.match(result)) {
      return { data: result.payload };
    }
    throw toErrorLike(result.payload, "Failed to refresh user");
  }, [dispatch, toErrorLike]);

  const loadProfile = useCallback(async () => {
    const result = await dispatch(fetchUserProfile());
    if (fetchUserProfile.fulfilled.match(result)) {
      return result.payload;
    }
    throw toErrorLike(result.payload, "Failed to load profile");
  }, [dispatch, toErrorLike]);

  const updateProfile = useCallback(async (data) => {
    const result = await dispatch(updateUserProfile(data));
    if (updateUserProfile.fulfilled.match(result)) {
      return result.payload;
    }
    throw toErrorLike(result.payload, "Failed to update profile");
  }, [dispatch, toErrorLike]);

  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    // User data (includes all profile fields like fullName, phone, etc.)
    user,
    // Loading states
    loading,
    profileLoading,
    // Auth state
    error,
    isAuthenticated,
    accessToken,
    // Auth actions
    login,
    register,
    logout,
    refreshUser: refreshUserData,
    markVerified,
    // Profile actions (part of auth, not separate)
    loadProfile,
    updateProfile,
    // Utilities
    clearError: clearAuthError
  };
}
