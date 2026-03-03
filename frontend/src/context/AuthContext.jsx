import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { bootstrapAuth } from "../store/slices/authSlice";

/**
 * AuthProvider - Bootstraps authentication on app load
 * Uses Redux for state management (single source of truth)
 */
export function AuthProvider({ children }) {
  const dispatch = useDispatch();

  // Bootstrap auth on mount - check if user is logged in
  useEffect(() => {
    dispatch(bootstrapAuth());
  }, [dispatch]);

  return children;
}
