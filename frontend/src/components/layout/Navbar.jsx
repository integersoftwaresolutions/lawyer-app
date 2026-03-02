import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../hooks/useAuth";
import Button from "../ui/Button";
import ThemeToggle from "../ThemeToggle";

export default function Navbar() {
  const { colors } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navStyles = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    rowGap: "12px",
    padding: "16px 24px",
    borderBottom: `1px solid ${colors.border}`,
    backgroundColor: colors.card,
    position: "sticky",
    top: 0,
    zIndex: 100,
  };

  const logoStyles = {
    fontSize: "20px",
    fontWeight: "bold",
    color: colors.text.primary,
    textDecoration: "none",
    flex: "0 0 auto",
  };

  const navLinksStyles = {
    display: "flex",
    alignItems: "center",
    gap: "24px",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    flex: "1 1 auto",
    minWidth: 0,
  };

  const linkStyles = {
    color: colors.text.secondary,
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "500",
    transition: "color 0.2s ease",
  };

  const userInfoStyles = {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getDashboardLink = () => {
    if (!user) return "/login";
    switch (user.role) {
      case "ADMIN":
        return "/admin/dashboard";
      case "LAWYER":
        return "/lawyer/dashboard";
      case "CLIENT":
        return "/client/dashboard";
      default:
        return "/";
    }
  };

  return (
    <nav style={navStyles}>
      <Link to="/" style={logoStyles}>
        Lawyer Marketplace
      </Link>

      <div style={navLinksStyles}>
        <Link to={user ? "/lawyers" : "/login"} style={linkStyles}>
          Find Lawyers
        </Link>
        <Link to="/pricing#pricing" style={linkStyles}>
          Pricing
        </Link>
        <Link to="/pricing#testimonials" style={linkStyles}>
          Testimonials
        </Link>

        {user ? (
          <div style={userInfoStyles}>
            <Link to={getDashboardLink()} style={linkStyles}>
              Dashboard
            </Link>
            <span style={{ color: colors.text.secondary, fontSize: "14px" }}>
              {user.email}
            </span>
            <Button variant="danger" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        ) : (
          <div style={userInfoStyles}>
            <Link to="/login" style={linkStyles}>
              Sign In
            </Link>
            <Button size="sm" onClick={() => navigate("/register")}>
              Get Started
            </Button>
          </div>
        )}
        <ThemeToggle />
      </div>
    </nav>
  );
}
