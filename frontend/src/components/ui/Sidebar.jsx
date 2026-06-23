import { useState, useEffect, useRef } from "react";
import { FiX } from "react-icons/fi";

/**
 * Reusable sidebar — filters, navigation, panels, etc.
 *
 * Desktop (md+): always visible beside main content.
 * Mobile: slide-over below navbar (h-14). Open via Navbar `showSidebarToggle`;
 * close via header X, overlay tap, or Escape.
 *
 * Parent layout:
 *   <Navbar showSidebarToggle onSidebarToggle={...} />
 *   <div className="flex flex-1 min-h-0 overflow-hidden">
 *     <Sidebar isOpen={open} onClose={...} title="Menu">...</Sidebar>
 *     <main>...</main>
 *   </div>
 */
export default function Sidebar({
  isOpen: controlledIsOpen,
  onClose,
  children,
  title,
  header,
  footer,
  className = "",
  contentClassName = "",
  width = "w-64",
  showCloseButton = true,
  position = "left",
  defaultOpen = false
}) {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);
  const overlayRef = useRef(null);

  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const handleClose = () => {
    if (isControlled) {
      onClose?.();
    } else {
      setInternalIsOpen(false);
    }
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) handleClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) handleClose();
  };

  const isRight = position === "right";
  const positionClasses = isRight ? "right-0" : "left-0";
  const translateClass = isRight
    ? isOpen
      ? "translate-x-0"
      : "translate-x-full"
    : isOpen
      ? "translate-x-0"
      : "-translate-x-full";

  const mobileHeader = (title || showCloseButton) && (
    <div className="shrink-0 flex items-center justify-between gap-2 border-b border-border px-4 py-3 md:hidden">
      {title ? (
        <h2 className="text-sm font-semibold text-text-primary truncate">{title}</h2>
      ) : (
        <span />
      )}
      {showCloseButton && (
        <button
          type="button"
          onClick={handleClose}
          className="p-2 rounded-lg hover:bg-surface transition-colors text-text-secondary hover:text-text-primary ml-auto shrink-0"
          aria-label="Close sidebar"
        >
          <FiX size={20} />
        </button>
      )}
    </div>
  );

  const desktopHeader = (title || header) && (
    <div className="hidden md:block shrink-0 border-b border-border px-6 py-4">
      {header || (title && <h2 className="text-sm font-semibold text-text-primary">{title}</h2>)}
    </div>
  );

  return (
    <>
      <div
        ref={overlayRef}
        onClick={handleOverlayClick}
        className={`fixed top-14 left-0 right-0 bottom-0 bg-black/50 z-40 transition-opacity duration-300 md:hidden ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      />

      <aside
        className={`
          ${width}
          ${positionClasses}
          fixed md:relative
          top-14 bottom-0 h-auto
          md:top-auto md:inset-auto md:h-full md:max-h-full
          z-50 md:z-auto
          shrink-0
          self-stretch
          min-h-0
          bg-card
          border-r border-border
          transition-transform duration-300 ease-in-out
          ${translateClass}
          md:translate-x-0
          flex flex-col
          overflow-hidden
          ${className}
        `}
      >
        {mobileHeader}
        {desktopHeader}

        <div
          className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain p-4 md:p-6 ${contentClassName}`}
        >
          {children}
        </div>

        {footer && (
          <div className="shrink-0 border-t border-border bg-card p-4 md:px-6 md:py-4">{footer}</div>
        )}
      </aside>
    </>
  );
}
