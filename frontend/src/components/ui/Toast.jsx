import { useEffect } from "react";
import { FiCheckCircle, FiXCircle, FiInfo, FiAlertCircle, FiX } from "react-icons/fi";

const TOAST_TYPES = {
  success: {
    icon: FiCheckCircle,
    title: "Success",
    bg: "bg-success-light",
    border: "border-success-border",
    iconWrap: "bg-success text-success-text",
    iconColor: "text-success-text"
  },
  error: {
    icon: FiXCircle,
    title: "Error",
    bg: "bg-danger-light",
    border: "border-danger-border",
    iconWrap: "bg-danger text-danger-text",
    iconColor: "text-danger-text"
  },
  info: {
    icon: FiInfo,
    title: "Info",
    bg: "bg-info-light",
    border: "border-info-border",
    iconWrap: "bg-info text-info-text",
    iconColor: "text-info-text"
  },
  warning: {
    icon: FiAlertCircle,
    title: "Warning",
    bg: "bg-warning-light",
    border: "border-warning-border",
    iconWrap: "bg-warning text-warning-text",
    iconColor: "text-warning-text"
  }
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
        flex items-start gap-3 p-3.5 rounded-xl border
        ${config.bg} ${config.border}
        shadow-lg transition-all duration-200
        min-w-[300px] max-w-[500px]
      `}
      role="alert"
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${config.iconWrap}`}>
        <Icon className={`${config.iconColor} text-base`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="m-0 text-xs font-semibold tracking-wide text-text-secondary uppercase">
          {config.title}
        </p>
        <p className="m-0 mt-0.5 text-sm font-medium text-text-primary leading-relaxed break-words">
          {message}
        </p>
      </div>
      <button
        onClick={() => onRemove(id)}
        className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
        aria-label="Close"
      >
        <FiX className="text-base" />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
}

