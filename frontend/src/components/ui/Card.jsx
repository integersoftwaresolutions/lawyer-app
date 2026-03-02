import { useTheme } from "../../context/ThemeContext";

export default function Card({ 
  children, 
  title,
  subtitle,
  headerAction,
  padding = "24px",
  style = {},
  ...props 
}) {
  const { colors } = useTheme();

  const cardStyles = {
    border: `1px solid ${colors.border}`,
    borderRadius: "8px",
    backgroundColor: colors.card,
    padding,
    ...style,
  };

  const headerStyles = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: title || subtitle ? "16px" : 0,
  };

  const titleStyles = {
    fontSize: "18px",
    fontWeight: "600",
    color: colors.text.primary,
    margin: 0,
  };

  const subtitleStyles = {
    fontSize: "14px",
    color: colors.text.secondary,
    marginTop: "4px",
  };

  return (
    <div style={cardStyles} {...props}>
      {(title || headerAction) && (
        <div style={headerStyles}>
          <div>
            {title && <h3 style={titleStyles}>{title}</h3>}
            {subtitle && <p style={subtitleStyles}>{subtitle}</p>}
          </div>
          {headerAction}
        </div>
      )}
      {children}
    </div>
  );
}
