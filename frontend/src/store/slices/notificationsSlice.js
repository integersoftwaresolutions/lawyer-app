import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { notificationsApi } from "../../services/notifications.api";
import { getErrorMessage } from "../../utils/errorHandler";

export const fetchUnreadCount = createAsyncThunk(
  "notifications/fetchUnreadCount",
  async (_, { rejectWithValue }) => {
    try {
      const res = await notificationsApi.unreadCount();
      return res.data?.unreadCount ?? 0;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchNotifications = createAsyncThunk(
  "notifications/fetchNotifications",
  async ({ page = 1, limit = 20, unreadOnly = false } = {}, { rejectWithValue }) => {
    try {
      const res = await notificationsApi.list({ page, limit, unreadOnly });
      return res;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchRecentNotifications = createAsyncThunk(
  "notifications/fetchRecentNotifications",
  async (_, { rejectWithValue }) => {
    try {
      const res = await notificationsApi.list({ page: 1, limit: 8, unreadOnly: false });
      return res;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const markNotificationRead = createAsyncThunk(
  "notifications/markNotificationRead",
  async (id, { rejectWithValue }) => {
    try {
      const res = await notificationsApi.markAsRead(id);
      return res.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const markAllNotificationsRead = createAsyncThunk(
  "notifications/markAllNotificationsRead",
  async (_, { rejectWithValue }) => {
    try {
      await notificationsApi.markAllAsRead();
      return true;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const initialState = {
  items: [],
  recentItems: [],
  unreadCount: 0,
  loading: false,
  recentLoading: false,
  pageLoading: false,
  error: null,
  meta: { page: 1, limit: 20, total: 0, pages: 0 }
};

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addRealtimeNotification(state, action) {
      const notification = action.payload;
      if (!notification?.id) return;

      const exists =
        state.recentItems.some((n) => n.id === notification.id) ||
        state.items.some((n) => n.id === notification.id);
      if (exists) return;

      state.recentItems.unshift(notification);
      state.recentItems = state.recentItems.slice(0, 8);

      if (!notification.readAt) {
        state.unreadCount += 1;
      }
    },
    clearNotifications(state) {
      Object.assign(state, initialState);
      state.loading = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      .addCase(fetchNotifications.pending, (state) => {
        state.pageLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.pageLoading = false;
        state.items = action.payload.items || [];
        state.unreadCount = action.payload.unreadCount ?? state.unreadCount;
        state.meta = action.payload.meta || state.meta;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.pageLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchRecentNotifications.pending, (state) => {
        state.recentLoading = true;
      })
      .addCase(fetchRecentNotifications.fulfilled, (state, action) => {
        state.recentLoading = false;
        state.recentItems = action.payload.items || [];
        state.unreadCount = action.payload.unreadCount ?? state.unreadCount;
      })
      .addCase(fetchRecentNotifications.rejected, (state) => {
        state.recentLoading = false;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const updated = action.payload;
        const wasUnreadRecent = state.recentItems.some((n) => n.id === updated.id && !n.readAt);
        const wasUnreadPage = state.items.some((n) => n.id === updated.id && !n.readAt);

        const mark = (list) =>
          list.map((n) => (n.id === updated.id ? { ...n, readAt: updated.readAt } : n));

        state.recentItems = mark(state.recentItems);
        state.items = mark(state.items);

        if ((wasUnreadRecent || wasUnreadPage) && updated.readAt) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        const now = new Date().toISOString();
        state.recentItems = state.recentItems.map((n) => ({ ...n, readAt: n.readAt || now }));
        state.items = state.items.map((n) => ({ ...n, readAt: n.readAt || now }));
        state.unreadCount = 0;
      });
  }
});

export const { addRealtimeNotification, clearNotifications } = notificationsSlice.actions;
export default notificationsSlice.reducer;
