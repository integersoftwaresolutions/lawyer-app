import { useEffect, useState } from "react";
import Button from "./Button";

export default function Modal({ 
  isOpen, 
  onClose, 
  title,
  children,
  footer,
  size = "md",
  closeOnOverlay = true,
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
    if (mounted) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mounted]);

  const handleContentAnimationEnd = () => {
    if (closing) {
      setMounted(false);
      setClosing(false);
    }
  };

  if (!mounted) return null;

  const sizeClasses = {
    sm: "max-w-[400px]",
    md: "max-w-[500px]",
    lg: "max-w-[700px]",
    xl: "max-w-[900px]",
  };

  const handleOverlayClick = (e) => {
    if (closeOnOverlay && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-5 ${
        closing ? "animate-modal-fade-out" : "animate-modal-fade-in"
      }`}
      onClick={handleOverlayClick}
    >
      <div
        className={`bg-card rounded-xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden flex flex-col origin-center ${
          closing ? "animate-modal-scale-out" : "animate-modal-scale-in"
        }`}
        onAnimationEnd={handleContentAnimationEnd}
      >
        <div className="flex justify-between items-center py-5 px-6 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary m-0">{title}</h2>
          <button 
            className="bg-transparent border-none text-2xl cursor-pointer text-text-secondary p-0 leading-none hover:text-text-primary transition-colors" 
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="py-4 px-6 border-t border-border flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
