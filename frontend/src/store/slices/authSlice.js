import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authApi } from "../../services/auth.api";
import { clientApi } from "../../services/client.api";
import { lawyerApi } from "../../services/lawyer.api";
import { storage } from "../../utils/storage";
import { getErrorMessage } from "../../utils/errorHandler";

// Helper to get the right profile API based on role
const getProfileApi = (role) => {
  return role === "LAWYER" ? lawyerApi : clientApi;
};

// Helper to fetch and merge profile data
const fetchUserWithProfile = async (user) => {
  if (!user?.role) return user;
  
  try {
    const api = getProfileApi(user.role);
    const profileRes = await api.getMyProfile();
    const profile = profileRes.data || {};
    
    // Merge profile data into user
    return {
      ...user,
      ...profile, // Profile data takes precedence
      profile // Keep full profile as nested object for detailed access
    };
  } catch (error) {
    // If profile fetch fails, return user without profile
    console.warn("Failed to fetch profile:", error);
    return user;
  }
};

// Initial state
const initialState = {
  user: null, // Complete user object including profile data
  accessToken: null,
  loading: true,
  profileLoading: false, // Separate loading state for profile operations
  error: null,
  isAuthenticated: false
};

// Async thunks
export const bootstrapAuth = createAsyncThunk(
  "auth/bootstrap",
  async (_, { rejectWithValue }) => {
    try {
      const token = storage.getAccessToken();
      if (!token) {
        return { user: null, accessToken: null };
      }
      const res = await authApi.me();
      const user = res.data;
      
      // Fetch and merge profile data
      const userWithProfile = await fetchUserWithProfile(user);
      
      return { user: userWithProfile, accessToken: token };
    } catch (error) {
      const status = error.response?.status;
      if (status === 401) {
        storage.clear();
      }
      return rejectWithValue(error.response?.data?.message || "Failed to load user");
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await authApi.login(payload);
      storage.setAccessToken(res.data.accessToken);
      const me = await authApi.me();
      const user = me.data;
      
      // Fetch and merge profile data
      const userWithProfile = await fetchUserWithProfile(user);
      
      return { user: userWithProfile, accessToken: res.data.accessToken };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Login failed");
    }
  }
);

export const registerUser = createAsyncThunk(
  "auth/register",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await authApi.register(payload);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Registration failed");
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await authApi.logout();
      storage.clear();
      return null;
    } catch (error) {
      storage.clear(); // Clear storage even if API call fails
      return rejectWithValue(error.response?.data?.message || "Logout failed");
    }
  }
);

export const refreshUser = createAsyncThunk(
  "auth/refreshUser",
  async (_, { rejectWithValue }) => {
    try {
      const res = await authApi.me();
      const user = res.data;
      
      // Fetch and merge profile data
      const userWithProfile = await fetchUserWithProfile(user);
      
      return userWithProfile;
    } catch (error) {
      const status = error.response?.status;
      if (status === 401) {
        storage.clear();
      }
      return rejectWithValue(error.response?.data?.message || "Failed to refresh user");
    }
  }
);

// Fetch profile and merge into user
export const fetchUserProfile = createAsyncThunk(
  "auth/fetchProfile",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const user = state.auth.user;
      if (!user?.role) {
        throw new Error("User not authenticated");
      }
      
      const api = getProfileApi(user.role);
      const res = await api.getMyProfile();
      const profile = res.data || {};
      
      // Return merged user with profile
      return {
        ...user,
        ...profile,
        profile
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Update profile and merge into user
export const updateUserProfile = createAsyncThunk(
  "auth/updateProfile",
  async (data, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const user = state.auth.user;
      if (!user?.role) {
        throw new Error("User not authenticated");
      }
      
      const api = getProfileApi(user.role);
      
      // Convert dateOfBirth string to Date if present
      const payload = { ...data };
      if (payload.dateOfBirth) {
        payload.dateOfBirth = new Date(payload.dateOfBirth).toISOString();
      }
      
      const res = await api.updateMyProfile(payload);
      const updatedProfile = res.data || {};
      
      // Return merged user with updated profile
      return {
        ...user,
        ...updatedProfile,
        profile: updatedProfile
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setAccessToken: (state, action) => {
      state.accessToken = action.payload;
      storage.setAccessToken(action.payload);
    },
    clearAuth: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.error = null;
      storage.clear();
    }
  },
  extraReducers: (builder) => {
    // Bootstrap
    builder
      .addCase(bootstrapAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = !!action.payload.user;
      })
      .addCase(bootstrapAuth.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.error = action.payload;
      });

    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      });

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Logout
    builder
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
      });

    // Refresh user
    builder
      .addCase(refreshUser.pending, (state) => {
        // Don't set loading to true to avoid UI flicker
      })
      .addCase(refreshUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(refreshUser.rejected, (state, action) => {
        if (action.payload?.includes("401") || action.payload?.includes("Unauthorized")) {
          state.user = null;
          state.accessToken = null;
          state.isAuthenticated = false;
        }
      });

    // Fetch profile
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.profileLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.error = action.payload;
      });

    // Update profile
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.profileLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, setAccessToken, clearAuth } = authSlice.actions;
export default authSlice.reducer;
