import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Button from "../ui/Button";
import Popover from "../ui/Popover";
import ThemeToggle from "../ThemeToggle";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getDashboardLink = () => {
    if (!user) return "/login";
    switch (user.role) {
      case "ADMIN":
        return "/admin/overview";
      case "LAWYER":
        return "/lawyer/overview";
      case "CLIENT":
        return "/client/overview";
      default:
        return "/";
    }
  };

  const getProfileLink = () => {
    if (!user) return "/login";
    switch (user.role) {
      case "ADMIN":
        return "/admin/settings";
      case "LAWYER":
        return "/lawyer/profile";
      case "CLIENT":
        return "/client/profile";
      default:
        return "/";
    }
  };

  const getUserInitials = () => {
    if (!user) return "?";
    const name = user.fullName || user.email || "User";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  return (
    <nav className="flex justify-between items-center flex-wrap gap-3 py-4 px-6 border-b border-border bg-card sticky top-0 z-[100]">
      <Link to="/" className="text-xl font-bold text-text-primary no-underline flex-none">
        Lawyer Marketplace
      </Link>

      <div className="flex items-center gap-6 flex-wrap justify-end flex-1 min-w-0">
        <Link to={user ? "/lawyers" : "/login"} className="text-text-secondary no-underline text-sm font-medium transition-colors hover:text-text-primary">
          Find Lawyers
        </Link>
        <Link to="/pricing#pricing" className="text-text-secondary no-underline text-sm font-medium transition-colors hover:text-text-primary">
          Pricing
        </Link>
        <Link to="/pricing#testimonials" className="text-text-secondary no-underline text-sm font-medium transition-colors hover:text-text-primary">
          Testimonials
        </Link>

        <ThemeToggle />

        {user ? (
          <Popover
            trigger={
              <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-text flex items-center justify-center text-sm font-semibold">
                  {getUserInitials()}
                </div>
              </div>
            }
            placement="bottom-end"
            className="p-2"
          >
            <div className="min-w-[200px]">
              <div className="px-4 py-3 border-b border-border">
                <div className="font-semibold text-text-primary text-sm">
                  {user.fullName || "User"}
                </div>
                <div className="text-xs text-text-secondary mt-1">
                  {user.email}
                </div>
              </div>
              <div className="py-1">
                <Link
                  to={getDashboardLink()}
                  className="block px-4 py-2 text-sm text-text-primary hover:bg-surface transition-colors rounded"
                >
                  Dashboard
                </Link>
                <Link
                  to={getProfileLink()}
                  className="block px-4 py-2 text-sm text-text-primary hover:bg-surface transition-colors rounded"
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-surface transition-colors rounded"
                >
                  Logout
                </button>
              </div>
            </div>
          </Popover>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="secondary" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
