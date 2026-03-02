import { useTheme } from "../../context/ThemeContext";

export default function Checkbox({ 
  label,
  error,
  checked = false,
  onChange,
  id,
  containerStyle = {},
  ...props 
}) {
  const { colors } = useTheme();

  const containerStyles = {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    marginBottom: "16px",
    ...containerStyle,
  };

  const checkboxStyles = {
    width: "18px",
    height: "18px",
    minWidth: "18px",
    borderRadius: "4px",
    border: `1px solid ${error ? "#dc3545" : colors.input.border}`,
    backgroundColor: checked ? colors.button.primary : colors.input.background,
    cursor: "pointer",
    appearance: "none",
    position: "relative",
    marginTop: "2px",
  };

  const labelStyles = {
    fontSize: "14px",
    color: colors.text.secondary,
    cursor: "pointer",
    lineHeight: "1.5",
  };

  const errorStyles = {
    marginTop: "4px",
    fontSize: "12px",
    color: "#dc3545",
  };

  const checkmarkStyles = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "10px",
    height: "10px",
    pointerEvents: "none",
  };

  return (
    <div>
      <div style={containerStyles}>
        <div style={{ position: "relative", display: "inline-flex" }}>
          <input 
            type="checkbox" 
            id={id}
            checked={checked}
            onChange={onChange}
            style={checkboxStyles}
            {...props} 
          />
          {checked && (
            <svg 
              style={checkmarkStyles}
              viewBox="0 0 12 10" 
              fill="none"
            >
              <path 
                d="M1 5L4.5 8.5L11 1" 
                stroke="white" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
        {label && (
          <label htmlFor={id} style={labelStyles}>
            {label}
          </label>
        )}
      </div>
      {error && <p style={errorStyles}>{error}</p>}
    </div>
  );
}
