import { useState, useEffect, useRef } from "react";
import { FiX, FiMenu } from "react-icons/fi";

/**
 * Reusable Sidebar Component
 * 
 * A base sidebar component that can be used for filters, navigation, etc.
 * - Sticky on desktop, always visible (height accounts for navbar)
 * - Hidden on mobile with slide-over animation (full screen)
 * - Built-in toggle button for mobile (top left)
 * - Supports both controlled and uncontrolled modes
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether sidebar is open (controlled mode, optional)
 * @param {Function} props.onToggle - Function to call when sidebar should toggle (controlled mode)
 * @param {Function} props.onClose - Function to call when sidebar should close (optional)
 * @param {React.ReactNode} props.children - Content to display in sidebar
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.width - Sidebar width (default: "w-64" for 256px)
 * @param {boolean} props.showCloseButton - Show close button in header (default: true on mobile)
 * @param {string} props.position - Position: "left" or "right" (default: "left")
 * @param {React.ReactNode} props.toggleButton - Custom toggle button (optional, appears top-left on mobile)
 * @param {boolean} props.defaultOpen - Default open state for uncontrolled mode (default: false on mobile, true on desktop)
 */
export default function Sidebar({
  isOpen: controlledIsOpen,
  onToggle,
  onClose,
  children,
  className = "",
  width = "w-64",
  showCloseButton = true,
  position = "left",
  toggleButton,
  defaultOpen = false
}) {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);
  const sidebarRef = useRef(null);
  const overlayRef = useRef(null);

  // Determine if we're in controlled or uncontrolled mode
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  // Toggle function
  const handleToggle = () => {
    if (isControlled) {
      onToggle?.(!isOpen);
    } else {
      setInternalIsOpen(prev => !prev);
    }
  };

  // Close function
  const handleClose = () => {
    if (isControlled) {
      onClose?.();
    } else {
      setInternalIsOpen(false);
    }
  };

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when sidebar is open on mobile
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on overlay click
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) {
      handleClose();
    }
  };

  const positionClasses = position === "right" ? "right-0" : "left-0";
  // On mobile: translate based on isOpen. On desktop: always visible (translate-x-0)
  const translateClass = position === "right" 
    ? (isOpen ? "translate-x-0" : "translate-x-full")
    : (isOpen ? "translate-x-0" : "-translate-x-full");

  // Default toggle button
  const defaultToggleButton = (
    <button
      onClick={handleToggle}
      className="md:hidden fixed top-4 left-4 z-[999] p-2 rounded-lg bg-card border border-border hover:bg-surface transition-colors text-text-primary shadow-lg"
      aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
    >
      {isOpen ? <FiX size={20} /> : <FiMenu size={20} />}
    </button>
  );

  return (
    <>
      {/* Toggle Button - Top Left on Mobile */}
      {toggleButton !== null && (
        toggleButton || defaultToggleButton
      )}

      {/* Mobile Overlay */}
      <div
        ref={overlayRef}
        onClick={handleOverlayClick}
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 md:hidden ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`
          ${width}
          ${positionClasses}
          fixed md:sticky
          top-0 md:top-0
          h-screen md:h-full
          max-h-screen md:max-h-full
          z-50
          bg-card
          border-r border-border
          transition-transform duration-300 ease-in-out
          ${translateClass}
          md:translate-x-0
          flex flex-col
          ${className}
        `}
      >
        {/* Header with Close Button (Mobile only) */}
        {(showCloseButton) && (
          <div className="sticky top-0 z-10 bg-card border-b border-border p-4 flex items-center justify-between md:hidden flex-shrink-0">
            {showCloseButton && (
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-surface transition-colors text-text-secondary hover:text-text-primary ml-auto"
                aria-label="Close sidebar"
              >
                <FiX size={20} />
              </button>
            )}
          </div>
        )}

        {/* Sidebar Content - Scrollable */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 p-4 md:p-6">
          {children}
        </div>
      </aside>
    </>
  );
}
