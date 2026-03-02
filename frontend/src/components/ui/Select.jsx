import { useTheme } from "../../context/ThemeContext";

export default function Select({ 
  label,
  error,
  options = [],
  placeholder = "Select an option",
  fullWidth = true,
  style = {},
  containerStyle = {},
  ...props 
}) {
  const { colors } = useTheme();

  const selectStyles = {
    width: fullWidth ? "100%" : "auto",
    padding: "12px 16px",
    borderRadius: "6px",
    border: `1px solid ${error ? "#dc3545" : colors.input.border}`,
    backgroundColor: colors.input.background,
    color: colors.input.text,
    fontSize: "14px",
    outline: "none",
    cursor: "pointer",
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    paddingRight: "36px",
    ...style,
  };

  const labelStyles = {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: "500",
    color: colors.text.secondary,
  };

  const errorStyles = {
    marginTop: "4px",
    fontSize: "12px",
    color: "#dc3545",
  };

  return (
    <div style={{ marginBottom: "16px", ...containerStyle }}>
      {label && <label style={labelStyles}>{label}</label>}
      <select style={selectStyles} {...props}>
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p style={errorStyles}>{error}</p>}
    </div>
  );
}
