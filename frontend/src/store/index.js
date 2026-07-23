import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import profileReducer from "./slices/profileSlice";
import notificationsReducer from "./slices/notificationsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    notifications: notificationsReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: [
          "auth/login/fulfilled", 
          "auth/refreshUser/fulfilled",
          "auth/bootstrap/fulfilled"
        ],
        // Ignore these paths in state
        ignoredPaths: ["auth.user", "profile.profile"],
      },
    }),
});

// Type exports removed - this is a JavaScript project
// If migrating to TypeScript, uncomment and convert file to .ts:
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;

