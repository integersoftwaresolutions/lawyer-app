import { useTheme } from "../../context/ThemeContext";

export default function Input({ 
  label,
  error,
  helperText,
  fullWidth = true,
  style = {},
  containerStyle = {},
  ...props 
}) {
  const { colors } = useTheme();

  const inputStyles = {
    width: fullWidth ? "100%" : "auto",
    padding: "12px 16px",
    borderRadius: "6px",
    border: `1px solid ${error ? "#dc3545" : colors.input.border}`,
    backgroundColor: colors.input.background,
    color: colors.input.text,
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s ease",
    ...style,
  };

  const labelStyles = {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: "500",
    color: colors.text.secondary,
  };

  const helperStyles = {
    marginTop: "4px",
    fontSize: "12px",
    color: error ? "#dc3545" : colors.text.muted,
  };

  return (
    <div style={{ marginBottom: "16px", ...containerStyle }}>
      {label && <label style={labelStyles}>{label}</label>}
      <input style={inputStyles} {...props} />
      {(error || helperText) && (
        <p style={helperStyles}>{error || helperText}</p>
      )}
    </div>
  );
}
