import { setAccessToken } from "../slices/authSlice";

/**
 * Middleware to sync access token from API client to Redux store
 * This ensures token updates (e.g., from refresh) are reflected in Redux
 */
export const tokenSyncMiddleware = (store) => (next) => (action) => {
  // If action contains accessToken, sync it to Redux
  if (action.payload?.accessToken) {
    store.dispatch(setAccessToken(action.payload.accessToken));
  }
  
  return next(action);
};


