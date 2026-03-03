import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  loginUser, 
  registerUser, 
  logoutUser, 
  refreshUser, 
  clearError,
  fetchUserProfile,
  updateUserProfile
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

  const login = useCallback(async (payload) => {
    const result = await dispatch(loginUser(payload));
    if (loginUser.fulfilled.match(result)) {
      return { data: { user: result.payload.user, accessToken: result.payload.accessToken } };
    }
    throw result.payload || new Error("Login failed");
  }, [dispatch]);

  const register = useCallback(async (payload) => {
    const result = await dispatch(registerUser(payload));
    if (registerUser.fulfilled.match(result)) {
      return result.payload;
    }
    throw result.payload || new Error("Registration failed");
  }, [dispatch]);

  const logout = useCallback(async () => {
    await dispatch(logoutUser());
  }, [dispatch]);

  const refreshUserData = useCallback(async () => {
    const result = await dispatch(refreshUser());
    if (refreshUser.fulfilled.match(result)) {
      return { data: result.payload };
    }
    throw result.payload || new Error("Failed to refresh user");
  }, [dispatch]);

  const loadProfile = useCallback(async () => {
    const result = await dispatch(fetchUserProfile());
    if (fetchUserProfile.fulfilled.match(result)) {
      return result.payload;
    }
    throw result.payload || new Error("Failed to load profile");
  }, [dispatch]);

  const updateProfile = useCallback(async (data) => {
    const result = await dispatch(updateUserProfile(data));
    if (updateUserProfile.fulfilled.match(result)) {
      return result.payload;
    }
    throw result.payload || new Error("Failed to update profile");
  }, [dispatch]);

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
    // Profile actions (part of auth, not separate)
    loadProfile,
    updateProfile,
    // Utilities
    clearError: clearAuthError
  };
}
