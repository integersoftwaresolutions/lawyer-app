import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";

/**
 * Right-side overlay drawer. Portaled to document.body so it spans the
 * full viewport (not clipped under the dashboard navbar).
 */
export default function Drawer({
  isOpen,
  onClose,
  title,
  children,
  footer,
  header,
  width = "max-w-md",
  closeOnOverlay = true,
  showCloseButton = true,
  contentClassName = ""
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

  const handlePanelAnimationEnd = () => {
    if (closing) {
      setMounted(false);
      setClosing(false);
    }
  };

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[2000]" role="dialog" aria-modal="true">
      <div
        className={`absolute inset-0 bg-black/50 ${
          closing ? "animate-modal-fade-out" : "animate-modal-fade-in"
        }`}
        onClick={() => {
          if (closeOnOverlay) onClose?.();
        }}
        aria-hidden="true"
      />
      <aside
        className={`
          fixed top-0 right-0 bottom-0 h-[100dvh] w-full ${width}
          bg-card border-l border-border shadow-2xl
          flex flex-col overflow-hidden z-10
          ${closing ? "animate-drawer-slide-out" : "animate-drawer-slide-in"}
        `}
        onAnimationEnd={handlePanelAnimationEnd}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0 flex-1">
            {header ||
              (title ? (
                <h2 className="text-base font-semibold text-text-primary m-0 truncate">{title}</h2>
              ) : null)}
          </div>
          {showCloseButton ? (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface transition-colors text-text-secondary hover:text-text-primary shrink-0"
              aria-label="Close"
            >
              <FiX size={18} />
            </button>
          ) : null}
        </div>

        <div
          className={`flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 ${contentClassName}`}
        >
          {children}
        </div>

        {footer ? (
          <div className="shrink-0 border-t border-border bg-card p-4 sm:px-5">{footer}</div>
        ) : null}
      </aside>
    </div>,
    document.body
  );
}
