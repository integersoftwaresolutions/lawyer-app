import { useTheme } from "../../context/ThemeContext";

export default function Badge({ 
  children, 
  variant = "default",
  size = "md",
  style = {},
  ...props 
}) {
  const { colors } = useTheme();

  const baseStyles = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "20px",
    fontWeight: "500",
    whiteSpace: "nowrap",
  };

  const sizeStyles = {
    sm: { padding: "4px 8px", fontSize: "11px" },
    md: { padding: "6px 12px", fontSize: "12px" },
    lg: { padding: "8px 16px", fontSize: "14px" },
  };

  const variantStyles = {
    default: {
      backgroundColor: colors.surface,
      color: colors.text.secondary,
    },
    primary: {
      backgroundColor: colors.button.primary,
      color: colors.button.primaryText,
    },
    success: {
      backgroundColor: "#d4edda",
      color: "#155724",
    },
    warning: {
      backgroundColor: "#fff3cd",
      color: "#856404",
    },
    danger: {
      backgroundColor: "#f8d7da",
      color: "#721c24",
    },
    info: {
      backgroundColor: "#d1ecf1",
      color: "#0c5460",
    },
  };

  const combinedStyles = {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...style,
  };

  return (
    <span style={combinedStyles} {...props}>
      {children}
    </span>
  );
}
