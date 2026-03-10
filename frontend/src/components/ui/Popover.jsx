import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export default function Popover({ 
  trigger, 
  children, 
  placement = "bottom-end", 
  className = "",
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  onToggle: controlledOnToggle
}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;
  
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);

  useEffect(() => {
    if (isOpen && triggerRef.current && popoverRef.current) {
      const updatePosition = () => {
        if (!triggerRef.current || !popoverRef.current) return;
        
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const popoverRect = popoverRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let top = 0;
        let left = 0;

        // Calculate position based on placement (using viewport coordinates for fixed positioning)
        switch (placement) {
          case "bottom-start":
            top = triggerRect.bottom + 8;
            left = triggerRect.left;
            break;
          case "bottom-end":
            top = triggerRect.bottom + 8;
            left = triggerRect.right - popoverRect.width;
            break;
          case "bottom":
            top = triggerRect.bottom + 8;
            left = triggerRect.left + (triggerRect.width - popoverRect.width) / 2;
            break;
          case "top-start":
            top = triggerRect.top - popoverRect.height - 8;
            left = triggerRect.left;
            break;
          case "top-end":
            top = triggerRect.top - popoverRect.height - 8;
            left = triggerRect.right - popoverRect.width;
            break;
          case "top":
            top = triggerRect.top - popoverRect.height - 8;
            left = triggerRect.left + (triggerRect.width - popoverRect.width) / 2;
            break;
          case "right-start":
            top = triggerRect.top;
            left = triggerRect.right + 8;
            break;
          case "right-end":
            top = triggerRect.bottom - popoverRect.height;
            left = triggerRect.right + 8;
            break;
          case "left-start":
            top = triggerRect.top;
            left = triggerRect.left - popoverRect.width - 8;
            break;
          case "left-end":
            top = triggerRect.bottom - popoverRect.height;
            left = triggerRect.left - popoverRect.width - 8;
            break;
          default:
            top = triggerRect.bottom + 8;
            left = triggerRect.right - popoverRect.width;
        }

        // Adjust to prevent overflow (viewport coordinates)
        if (left + popoverRect.width > viewportWidth) {
          left = viewportWidth - popoverRect.width - 8;
        }
        if (left < 0) {
          left = 8;
        }
        if (top + popoverRect.height > viewportHeight) {
          top = viewportHeight - popoverRect.height - 8;
        }
        if (top < 0) {
          top = 8;
        }

        setPosition({ top, left });
      };

      // Use double requestAnimationFrame to ensure DOM is fully rendered
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          updatePosition();
        });
      });

      // Update on scroll/resize - use requestAnimationFrame for smooth updates
      let rafId = null;
      const scrollHandler = () => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(updatePosition);
      };
      
      // Listen to scroll on window and document (capture phase to catch all scroll events)
      window.addEventListener("scroll", scrollHandler, true);
      document.addEventListener("scroll", scrollHandler, true);
      window.addEventListener("resize", scrollHandler);

      return () => {
        if (rafId) cancelAnimationFrame(rafId);
        window.removeEventListener("scroll", scrollHandler, true);
        document.removeEventListener("scroll", scrollHandler, true);
        window.removeEventListener("resize", scrollHandler);
      };
    }
  }, [isOpen, placement]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isOpen &&
        popoverRef.current &&
        triggerRef.current &&
        !popoverRef.current.contains(event.target) &&
        !triggerRef.current.contains(event.target)
      ) {
        if (isControlled) {
          controlledOnClose?.();
        } else {
          setInternalIsOpen(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen, isControlled, controlledOnClose]);

  const handleTriggerClick = (e) => {
    e.stopPropagation();
    if (isControlled) {
      if (controlledOnToggle) {
        controlledOnToggle();
      } else if (controlledOnClose && isOpen) {
        controlledOnClose();
      }
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  return (
    <>
      <div ref={triggerRef} onClick={handleTriggerClick} className="cursor-pointer">
        {trigger}
      </div>
      {isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            className={`fixed z-[9999] bg-card border border-border rounded-lg shadow-lg min-w-[200px] max-w-[90vw] max-h-[90vh] overflow-auto ${className}`}
            style={{
              top: position.top > 0 ? `${position.top}px` : "0px",
              left: position.left > 0 ? `${position.left}px` : "0px",
              visibility: position.top > 0 && position.left > 0 ? "visible" : "hidden",
            }}
          >
            {children}
          </div>,
          document.body
        )}
    </>
  );
}

