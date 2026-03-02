import { useTheme } from "../../context/ThemeContext";

export default function StatCard({ 
  icon,
  value,
  label,
  trend,
  trendUp,
  style = {},
  ...props 
}) {
  const { colors } = useTheme();

  const cardStyles = {
    border: `1px solid ${colors.border}`,
    borderRadius: "8px",
    backgroundColor: colors.surface,
    padding: "20px",
    textAlign: "center",
    ...style,
  };

  const iconStyles = {
    fontSize: "32px",
    marginBottom: "8px",
  };

  const valueStyles = {
    fontSize: "28px",
    fontWeight: "bold",
    color: colors.text.primary,
    marginBottom: "4px",
  };

  const labelStyles = {
    fontSize: "14px",
    color: colors.text.secondary,
  };

  const trendStyles = {
    fontSize: "12px",
    marginTop: "8px",
    color: trendUp ? "#28a745" : "#dc3545",
  };

  return (
    <div style={cardStyles} {...props}>
      {icon && <div style={iconStyles}>{icon}</div>}
      <div style={valueStyles}>{value}</div>
      <div style={labelStyles}>{label}</div>
      {trend && (
        <div style={trendStyles}>
          {trendUp ? "↑" : "↓"} {trend}
        </div>
      )}
    </div>
  );
}
