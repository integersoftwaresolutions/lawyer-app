import { useCallback, useEffect, useState } from "react";
import { FiAlertTriangle, FiRefreshCw, FiX } from "react-icons/fi";
import {
  onSessionDegraded,
  onSessionRecovered,
  notifySessionRecovered
} from "../auth/session";
import { refreshAccessToken } from "../services/apiClient";
import { Button } from "./ui";

/**
 * Global banner when refresh/API is temporarily unavailable (infra), not session death.
 */
export default function SessionBanner() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const offDegraded = onSessionDegraded((detail) => {
      setMessage(
        detail?.message ||
          "Can't reach the server. Check your connection and try again."
      );
      setVisible(true);
    });
    const offRecovered = onSessionRecovered(() => {
      setVisible(false);
      setMessage("");
    });
    return () => {
      offDegraded();
      offRecovered();
    };
  }, []);

  const handleRetry = useCallback(async () => {
    setRetrying(true);
    try {
      await refreshAccessToken();
      notifySessionRecovered();
      setVisible(false);
    } catch {
      /* still degraded — banner stays; forceLogout handles session death */
    } finally {
      setRetrying(false);
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      role="alert"
      className="fixed top-0 inset-x-0 z-[300] border-b border-warning bg-warning-light text-text-primary"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex items-center gap-3">
        <FiAlertTriangle className="w-5 h-5 text-warning shrink-0" />
        <p className="text-sm flex-1 m-0 min-w-0">{message}</p>
        <Button
          size="sm"
          variant="secondary"
          icon={FiRefreshCw}
          loading={retrying}
          onClick={handleRetry}
        >
          Retry
        </Button>
        <button
          type="button"
          className="p-1.5 rounded-lg text-text-muted hover:bg-surface-hover"
          aria-label="Dismiss"
          onClick={() => setVisible(false)}
        >
          <FiX className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
