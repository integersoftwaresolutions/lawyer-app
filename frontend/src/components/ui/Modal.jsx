import { useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
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
  const { colors } = useTheme();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeStyles = {
    sm: { maxWidth: "400px" },
    md: { maxWidth: "500px" },
    lg: { maxWidth: "700px" },
    xl: { maxWidth: "900px" },
  };

  const overlayStyles = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px",
  };

  const modalStyles = {
    backgroundColor: colors.card,
    borderRadius: "12px",
    width: "100%",
    ...sizeStyles[size],
    maxHeight: "90vh",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  };

  const headerStyles = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    borderBottom: `1px solid ${colors.border}`,
  };

  const titleStyles = {
    fontSize: "18px",
    fontWeight: "600",
    color: colors.text.primary,
    margin: 0,
  };

  const closeButtonStyles = {
    background: "none",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    color: colors.text.secondary,
    padding: "0",
    lineHeight: "1",
  };

  const bodyStyles = {
    padding: "24px",
    overflowY: "auto",
    flex: 1,
  };

  const footerStyles = {
    padding: "16px 24px",
    borderTop: `1px solid ${colors.border}`,
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
  };

  const handleOverlayClick = (e) => {
    if (closeOnOverlay && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div style={overlayStyles} onClick={handleOverlayClick}>
      <div style={modalStyles}>
        <div style={headerStyles}>
          <h2 style={titleStyles}>{title}</h2>
          <button style={closeButtonStyles} onClick={onClose}>
            ×
          </button>
        </div>
        <div style={bodyStyles}>{children}</div>
        {footer && <div style={footerStyles}>{footer}</div>}
      </div>
    </div>
  );
}
