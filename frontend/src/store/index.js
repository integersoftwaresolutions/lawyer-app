import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import profileReducer from "./slices/profileSlice";
import notificationsReducer from "./slices/notificationsSlice";
import workspaceReducer from "./slices/workspaceSlice";
import { bindSessionStore } from "../auth/session";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    notifications: notificationsReducer,
    workspace: workspaceReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          "auth/login/fulfilled",
          "auth/refreshUser/fulfilled",
          "auth/bootstrap/fulfilled"
        ],
        ignoredPaths: ["auth.user", "profile.profile"]
      }
    })
});

bindSessionStore(store);
