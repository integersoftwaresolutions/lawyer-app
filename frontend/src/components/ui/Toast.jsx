import { useEffect } from "react";
import { FiCheckCircle, FiXCircle, FiInfo, FiAlertCircle, FiX } from "react-icons/fi";

const TOAST_TYPES = {
  success: { icon: FiCheckCircle, bg: "bg-success/10", border: "border-success/30", text: "text-success", iconColor: "text-success" },
  error: { icon: FiXCircle, bg: "bg-danger/10", border: "border-danger/30", text: "text-danger", iconColor: "text-danger" },
  info: { icon: FiInfo, bg: "bg-info/10", border: "border-info/30", text: "text-info", iconColor: "text-info" },
  warning: { icon: FiAlertCircle, bg: "bg-warning/10", border: "border-warning/30", text: "text-warning", iconColor: "text-warning" }
};

export function Toast({ toast, onRemove }) {
  const { id, message, type = "info", duration = 5000 } = toast;
  const config = TOAST_TYPES[type] || TOAST_TYPES.info;
  const Icon = config.icon;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onRemove(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onRemove]);

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg border backdrop-blur-sm
        ${config.bg} ${config.border} ${config.text}
        shadow-lg animate-in slide-in-from-right-full
        min-w-[300px] max-w-[500px]
      `}
      role="alert"
    >
      <Icon className={`${config.iconColor} flex-shrink-0 mt-0.5 text-lg`} />
      <div className="flex-1 text-sm font-medium">{message}</div>
      <button
        onClick={() => onRemove(id)}
        className="flex-shrink-0 text-text-secondary hover:text-text-primary transition-colors"
        aria-label="Close"
      >
        <FiX className="text-lg" />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
}

