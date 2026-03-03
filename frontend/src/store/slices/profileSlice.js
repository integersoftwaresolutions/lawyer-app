import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { clientApi } from "../../services/client.api";
import { lawyerApi } from "../../services/lawyer.api";
import { getErrorMessage } from "../../utils/errorHandler";

// Initial state
const initialState = {
  profile: null,
  loading: false,
  saving: false,
  error: null,
  lastUpdated: null
};

// Helper to get the right API based on role
const getProfileApi = (role) => {
  return role === "LAWYER" ? lawyerApi : clientApi;
};

// Async thunks
export const fetchProfile = createAsyncThunk(
  "profile/fetchProfile",
  async (role, { rejectWithValue }) => {
    try {
      const api = getProfileApi(role);
      const res = await api.getMyProfile();
      return res.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const updateProfile = createAsyncThunk(
  "profile/updateProfile",
  async ({ role, data }, { rejectWithValue }) => {
    try {
      const api = getProfileApi(role);
      // Convert dateOfBirth string to Date if present
      const payload = { ...data };
      if (payload.dateOfBirth) {
        payload.dateOfBirth = new Date(payload.dateOfBirth).toISOString();
      }
      const res = await api.updateMyProfile(payload);
      return res.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Profile slice
const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    clearProfile: (state) => {
      state.profile = null;
      state.error = null;
      state.lastUpdated = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setProfile: (state, action) => {
      state.profile = action.payload;
      state.lastUpdated = new Date().toISOString();
    }
  },
  extraReducers: (builder) => {
    // Fetch profile
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
        state.lastUpdated = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update profile
    builder
      .addCase(updateProfile.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.saving = false;
        state.profile = action.payload;
        state.lastUpdated = new Date().toISOString();
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });
  }
});

export const { clearProfile, clearError, setProfile } = profileSlice.actions;
export default profileSlice.reducer;

