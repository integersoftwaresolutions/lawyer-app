import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
// Profile is now part of auth slice - keeping profileReducer for backward compatibility
import profileReducer from "./slices/profileSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer // Kept for backward compatibility, but profile data is in auth.user
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

