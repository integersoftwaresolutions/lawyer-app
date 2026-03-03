import { createContext, useState, useCallback, useMemo } from "react";
import { ToastContainer } from "../components/ui/Toast";

export const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ message, type = "info", duration = 5000 }) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((message, duration) => {
    return addToast({ message, type: "success", duration });
  }, [addToast]);

  const error = useCallback((message, duration) => {
    return addToast({ message, type: "error", duration });
  }, [addToast]);

  const info = useCallback((message, duration) => {
    return addToast({ message, type: "info", duration });
  }, [addToast]);

  const warning = useCallback((message, duration) => {
    return addToast({ message, type: "warning", duration });
  }, [addToast]);

  const value = useMemo(
    () => ({
      success,
      error,
      info,
      warning,
      addToast
    }),
    [success, error, info, warning, addToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

