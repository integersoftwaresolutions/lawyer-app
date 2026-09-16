import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Centered modal overlay. Portaled to document.body so dashboard
 * overflow/stacking never clips it below the navbar.
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
  closeOnOverlay = true
}) {
  const [mounted, setMounted] = useState(isOpen);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setClosing(false);
    } else if (mounted) {
      setClosing(true);
    }
  }, [isOpen, mounted]);

  useEffect(() => {
    if (!mounted) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [mounted, onClose]);

  const handleContentAnimationEnd = () => {
    if (closing) {
      setMounted(false);
      setClosing(false);
    }
  };

  if (!mounted || typeof document === "undefined") return null;

  const sizeClasses = {
    sm: "max-w-[400px]",
    md: "max-w-[500px]",
    lg: "max-w-[700px]",
    xl: "max-w-[900px]"
  };

  const handleOverlayClick = (e) => {
    if (closeOnOverlay && e.target === e.currentTarget) onClose?.();
  };

  return createPortal(
    <div
      className={`fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-6 bg-black/50 ${
        closing ? "animate-modal-fade-out" : "animate-modal-fade-in"
      }`}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`
          relative z-10 bg-card rounded-xl w-full ${sizeClasses[size]}
          max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)]
          overflow-hidden flex flex-col shadow-xl
          ${closing ? "animate-modal-scale-out" : "animate-modal-scale-in"}
        `}
        onClick={(e) => e.stopPropagation()}
        onAnimationEnd={handleContentAnimationEnd}
      >
        <div className="shrink-0 flex justify-between items-center gap-3 py-4 px-5 sm:px-6 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary m-0 truncate">{title}</h2>
          <button
            type="button"
            className="bg-transparent border-none text-2xl cursor-pointer text-text-secondary p-0 leading-none hover:text-text-primary transition-colors shrink-0"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 min-h-0 overscroll-contain">
          {children}
        </div>
        {footer ? (
          <div className="shrink-0 py-3.5 px-5 sm:px-6 border-t border-border flex justify-end gap-3 bg-card">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
