import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Button from "../ui/Button";
import Popover from "../ui/Popover";
import Avatar from "../ui/Avatar";
import ThemeToggle from "../ThemeToggle";
import { FiMenu, FiX } from "react-icons/fi";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [navigate]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
    setMobileMenuOpen(false);
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

  const navLinks = [
    { to: user ? "/lawyers" : "/login", label: "Find Lawyers" },
    { to: "/pricing#pricing", label: "Pricing" },
    { to: "/pricing#testimonials", label: "Testimonials" },
  ];

  return (
    <>
      <nav className="flex justify-between items-center gap-4 py-4 px-4 md:px-6 border-b border-border bg-card sticky top-0 z-[100]">
        {/* Logo */}
        <Link 
          to="/" 
          className="text-lg md:text-xl font-bold text-text-primary no-underline flex-none"
        >
          Lawyer Marketplace
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6 flex-1 justify-end">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-text-secondary no-underline text-sm font-medium transition-colors hover:text-text-primary whitespace-nowrap"
            >
              {link.label}
            </Link>
          ))}

          <ThemeToggle />

          {user ? (
            <Popover
              trigger={
                <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                  <Avatar
                    user={user}
                    size="sm"
                    showBorder={false}
                  />
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

        {/* Mobile Right Side - Theme Toggle, Avatar/Buttons, Menu Button */}
        <div className="flex items-center gap-3 md:hidden">
          <ThemeToggle />
          
          {user ? (
            <Popover
              trigger={
                <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                  <Avatar
                    user={user}
                    size="sm"
                    showBorder={false}
                  />
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
            <Link to="/login">
              <Button variant="secondary" size="sm">
                Sign In
              </Button>
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-surface transition-colors text-text-primary"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[99] md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      <div
        className={`
          fixed top-[73px] left-0 right-0
          bg-card border-b border-border
          z-[99]
          transition-transform duration-300 ease-in-out
          md:hidden
          ${mobileMenuOpen ? "translate-y-0" : "-translate-y-full"}
          max-h-[calc(100vh-73px)] overflow-y-auto
        `}
      >
        <div className="px-4 py-4 space-y-1">
          {/* Navigation Links */}
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 rounded-lg text-text-primary no-underline text-sm font-medium hover:bg-surface transition-colors"
            >
              {link.label}
            </Link>
          ))}

          {/* Guest User Actions */}
          {!user && (
            <>
              <div className="border-t border-border my-2" />
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 rounded-lg bg-primary text-primary-text no-underline text-sm font-medium text-center hover:opacity-90 transition-opacity"
              >
                Get Started
              </Link>
            </>
          )}

          {/* Authenticated User Actions */}
          {user && (
            <>
              <div className="border-t border-border my-2" />
              <Link
                to={getDashboardLink()}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 rounded-lg text-text-primary no-underline text-sm font-medium hover:bg-surface transition-colors"
              >
                Dashboard
              </Link>
              <Link
                to={getProfileLink()}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 rounded-lg text-text-primary no-underline text-sm font-medium hover:bg-surface transition-colors"
              >
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 rounded-lg text-danger text-sm font-medium hover:bg-surface transition-colors"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
