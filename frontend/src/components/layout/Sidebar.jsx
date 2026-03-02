import { useTheme } from "../../context/ThemeContext";
import { Link, useLocation } from "react-router-dom";

export default function Sidebar({ 
  items = [], 
  basePath = "",
  style = {},
}) {
  const { colors } = useTheme();
  const location = useLocation();

  const sidebarStyles = {
    width: "260px",
    minWidth: "260px",
    border: `1px solid ${colors.border}`,
    borderRadius: "8px",
    backgroundColor: colors.card,
    padding: "16px",
    height: "fit-content",
    position: "sticky",
    top: "20px",
    ...style,
  };

  const navItemStyles = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    borderRadius: "6px",
    marginBottom: "4px",
    textDecoration: "none",
    transition: "all 0.2s ease",
    cursor: "pointer",
  };

  const getItemStyles = (path) => {
    const isActive = location.pathname === path;
    return {
      ...navItemStyles,
      backgroundColor: isActive ? colors.button.primary : "transparent",
      color: isActive ? colors.button.primaryText : colors.text.secondary,
    };
  };

  const iconStyles = {
    fontSize: "18px",
    width: "24px",
    textAlign: "center",
  };

  const labelStyles = {
    fontSize: "14px",
    fontWeight: "500",
  };

  return (
    <nav style={sidebarStyles}>
      {items.map((item) => {
        const path = `${basePath}/${item.id}`;
        return (
          <Link
            key={item.id}
            to={path}
            style={getItemStyles(path)}
          >
            <span style={iconStyles}>{item.icon}</span>
            <span style={labelStyles}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
