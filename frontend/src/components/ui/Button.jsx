import { useTheme } from "../../context/ThemeContext";

export default function Button({ 
  children, 
  variant = "primary", 
  size = "md", 
  fullWidth = false,
  loading = false,
  disabled = false,
  style = {},
  ...props 
}) {
  const { colors } = useTheme();

  const baseStyles = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    borderRadius: "6px",
    fontWeight: "500",
    cursor: disabled || loading ? "not-allowed" : "pointer",
    opacity: disabled || loading ? 0.6 : 1,
    transition: "all 0.2s ease",
    border: "none",
    width: fullWidth ? "100%" : "auto",
  };

  const sizeStyles = {
    sm: { padding: "8px 16px", fontSize: "13px" },
    md: { padding: "12px 24px", fontSize: "14px" },
    lg: { padding: "16px 32px", fontSize: "16px" },
  };

  const variantStyles = {
    primary: {
      backgroundColor: colors.button.primary,
      color: colors.button.primaryText,
    },
    secondary: {
      backgroundColor: "transparent",
      color: colors.text.primary,
      border: `1px solid ${colors.border}`,
    },
    danger: {
      backgroundColor: "#dc3545",
      color: "#ffffff",
    },
    success: {
      backgroundColor: "#28a745",
      color: "#ffffff",
    },
    ghost: {
      backgroundColor: "transparent",
      color: colors.text.primary,
    },
  };

  const combinedStyles = {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...style,
  };

  return (
    <button
      style={combinedStyles}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span style={{ marginRight: "8px" }}>...</span>}
      {children}
    </button>
  );
}
