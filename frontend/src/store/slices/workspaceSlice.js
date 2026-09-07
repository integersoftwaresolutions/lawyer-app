import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { workspaceApi } from "../../services/workspace.api";
import { storage } from "../../utils/storage";

const STORAGE_KEY = "activeWorkspaceId";

export const fetchWorkspaces = createAsyncThunk(
  "workspace/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await workspaceApi.list();
      return res.items || [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const activateWorkspace = createAsyncThunk(
  "workspace/activate",
  async (workspaceId, { rejectWithValue }) => {
    try {
      const res = await workspaceApi.activate(workspaceId);
      storage.setItem?.(STORAGE_KEY, workspaceId);
      try {
        localStorage.setItem(STORAGE_KEY, workspaceId);
      } catch {
        /* ignore */
      }
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const createFirm = createAsyncThunk(
  "workspace/createFirm",
  async (body, { dispatch, rejectWithValue }) => {
    try {
      const res = await workspaceApi.createFirm(body);
      const data = res.data;
      if (data?.requiresCheckout && data?.checkoutUrl) {
        return data;
      }
      await dispatch(fetchWorkspaces());
      if (data?.id) {
        await dispatch(activateWorkspace(data.id));
      }
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const acceptWorkspaceInvite = createAsyncThunk(
  "workspace/acceptInvite",
  async (token, { dispatch, rejectWithValue }) => {
    try {
      const res = await workspaceApi.acceptInvite(token);
      await dispatch(fetchWorkspaces());
      if (res.data?.id) {
        await dispatch(activateWorkspace(res.data.id));
      }
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const initialState = {
  items: [],
  activeWorkspaceId: (() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || null;
    } catch {
      return null;
    }
  })(),
  activeWorkspace: null,
  permissions: [],
  loading: false,
  error: null
};

const workspaceSlice = createSlice({
  name: "workspace",
  initialState,
  reducers: {
    clearWorkspaces(state) {
      state.items = [];
      state.activeWorkspaceId = null;
      state.activeWorkspace = null;
      state.permissions = [];
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
    },
    setActiveLocal(state, action) {
      state.activeWorkspaceId = action.payload;
      try {
        localStorage.setItem(STORAGE_KEY, action.payload);
      } catch {
        /* ignore */
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkspaces.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkspaces.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload || [];
        const preferred =
          state.activeWorkspaceId &&
          state.items.find((w) => String(w.id) === String(state.activeWorkspaceId));
        const personal = state.items.find((w) => w.type === "PERSONAL");
        const active = preferred || personal || state.items[0] || null;
        if (active) {
          state.activeWorkspaceId = active.id;
          state.activeWorkspace = active;
          state.permissions = active.membership?.permissions || [];
          try {
            localStorage.setItem(STORAGE_KEY, active.id);
          } catch {
            /* ignore */
          }
        }
      })
      .addCase(fetchWorkspaces.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(activateWorkspace.fulfilled, (state, action) => {
        const ws = action.payload;
        if (!ws) return;
        state.activeWorkspaceId = ws.id;
        state.activeWorkspace = ws;
        state.permissions = ws.membership?.permissions || [];
        const idx = state.items.findIndex((w) => String(w.id) === String(ws.id));
        if (idx >= 0) state.items[idx] = { ...state.items[idx], ...ws };
      });
  }
});

export const { clearWorkspaces, setActiveLocal } = workspaceSlice.actions;

export function selectActiveWorkspace(state) {
  return state.workspace.activeWorkspace;
}

export function selectWorkspacePermissions(state) {
  return state.workspace.permissions || [];
}

export function selectHasPermission(state, key) {
  const perms = state.workspace.permissions || [];
  return perms.includes(key);
}

export default workspaceSlice.reducer;
