import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiAlertTriangle, FiRefreshCw } from "react-icons/fi";
import { bootstrapAuth } from "../store/slices/authSlice";
import { useAuth } from "../hooks/useAuth";
import { notifySessionDegraded, notifySessionRecovered } from "../auth/session";
import { SESSION_ERROR } from "../auth/sessionErrors";
import { Button } from "./ui";

/**
 * Central entry: bootstrap auth, loading UI, and infra reconnect when bootstrap can't reach API.
 */
export default function Gateway({ children }) {
  const dispatch = useDispatch();
  const { loading } = useAuth();
  const bootstrapError = useSelector((s) => s.auth.error);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    dispatch(bootstrapAuth());
  }, [dispatch]);

  useEffect(() => {
    if (
      bootstrapError &&
      typeof bootstrapError === "object" &&
      bootstrapError.code === SESSION_ERROR.AUTH_UNAVAILABLE
    ) {
      notifySessionDegraded({ message: bootstrapError.message });
    }
  }, [bootstrapError]);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await dispatch(bootstrapAuth()).unwrap();
      notifySessionRecovered();
    } catch {
      /* error state updated in slice */
    } finally {
      setRetrying(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Initializing..." />;
  }

  if (
    bootstrapError &&
    typeof bootstrapError === "object" &&
    bootstrapError.code === SESSION_ERROR.AUTH_UNAVAILABLE
  ) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-xl border border-card-border bg-card p-6 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-warning-light text-warning flex items-center justify-center">
            <FiAlertTriangle className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-semibold text-text-primary m-0">Can't reach the server</h1>
          <p className="text-sm text-text-secondary m-0">
            {bootstrapError.message ||
              "Check your connection and try again. Your session was kept."}
          </p>
          <Button
            fullWidth
            icon={FiRefreshCw}
            loading={retrying}
            onClick={handleRetry}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return children;
}

function LoadingScreen({ message = "Loading..." }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-2 border-border rounded-full" />
          <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-sm text-text-secondary font-medium">{message}</p>
      </div>
    </div>
  );
}
