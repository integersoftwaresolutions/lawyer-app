import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Button from "../ui/Button";
import ThemeToggle from "../ThemeToggle";

export default function DashboardLayout({ 
  children, 
  title,
  menuItems = [],
  basePath = "",
}) {
  const { colors } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const containerStyles = {
    minHeight: "100vh",
    backgroundColor: colors.background,
    color: colors.text.primary,
  };

  const headerStyles = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    rowGap: "12px",
    padding: "20px 24px",
    borderBottom: `1px solid ${colors.border}`,
    backgroundColor: colors.card,
  };

  const titleStyles = {
    fontSize: "24px",
    fontWeight: "bold",
    color: colors.text.primary,
  };

  const userInfoStyles = {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  };

  const contentWrapperStyles = {
    display: "flex",
    padding: "24px",
    gap: "24px",
  };

  const mainContentStyles = {
    flex: 1,
    minWidth: 0,
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div style={containerStyles}>
      <header style={headerStyles}>
        <h1 style={titleStyles}>{title}</h1>
        <div style={userInfoStyles}>
          <span style={{ color: colors.text.secondary, fontSize: "14px" }}>
            Welcome, {user?.email || "User"}
          </span>
          <ThemeToggle />
          <Button variant="danger" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>

      <div style={contentWrapperStyles}>
        <Sidebar items={menuItems} basePath={basePath} />
        <main style={mainContentStyles}>
          {children}
        </main>
      </div>
    </div>
  );
}
