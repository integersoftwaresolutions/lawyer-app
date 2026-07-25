import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useLogoutConfirm } from "../../context/LogoutConfirmContext";
import Button from "../ui/Button";
import Popover from "../ui/Popover";
import Avatar from "../ui/Avatar";
import ThemeToggle from "../ThemeToggle";
import NotificationBell from "../notifications/NotificationBell";
import UserMenuPanel from "./UserMenuPanel";
import { getDashboardPath, getProfilePath } from "../../utils/authRoutes";
import { FiMenu, FiX, FiMoreVertical } from "react-icons/fi";

export default function Navbar({
  onSidebarToggle,
  showSidebarToggle = false,
  startSlot = null,
  hideBrand = false,
  hideMarketingLinks = false
}) {
  const { user } = useAuth();
  const { requestLogout } = useLogoutConfirm();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

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

  const navLinks = hideMarketingLinks
    ? []
    : [
        { to: user ? "/lawyers" : "/login", label: "Find Lawyers" },
        { to: "/pricing#pricing", label: "Pricing" },
        { to: "/pricing#testimonials", label: "Testimonials" }
      ];

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleMobileLogout = () => {
    closeMobileMenu();
    requestLogout();
  };

  return (
    <>
      <nav className="flex justify-between items-center gap-2 sm:gap-3 h-14 min-h-[56px] px-3 sm:px-4 md:px-5 border-b border-border bg-card sticky top-0 z-[100]">
        <div className="flex items-center gap-2 min-w-0 flex-1 md:flex-none">
          {showSidebarToggle && (
            <button
              type="button"
              onClick={onSidebarToggle}
              className="md:hidden p-1.5 rounded-lg hover:bg-surface transition-colors text-text-primary shrink-0"
              aria-label="Open sidebar"
            >
              <FiMenu size={20} />
            </button>
          )}
          {startSlot ? (
            <div className="min-w-0 flex-1 md:flex-none">{startSlot}</div>
          ) : !hideBrand ? (
            <Link
              to="/"
              className="font-bold text-text-primary no-underline truncate text-lg md:text-xl"
            >
              Lawyer Marketplace
            </Link>
          ) : null}
        </div>

        <div className="hidden md:flex items-center flex-1 justify-end gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-text-secondary no-underline font-medium transition-colors hover:text-text-primary whitespace-nowrap text-sm"
            >
              {link.label}
            </Link>
          ))}

          <ThemeToggle />

          {user ? <NotificationBell /> : null}

          {user ? (
            <Popover
              trigger={
                <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                  <Avatar user={user} size="sm" showBorder={false} />
                </div>
              }
              placement="bottom-end"
              className="p-2"
            >
              <div className="min-w-[200px]">
                <UserMenuPanel />
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
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 md:hidden">
          <ThemeToggle />

          {user ? <NotificationBell /> : null}

          {user ? (
            <Popover
              trigger={
                <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                  <Avatar user={user} size="sm" showBorder={false} />
                </div>
              }
              placement="bottom-end"
              className="p-2"
            >
              <div className="min-w-[200px]">
                <UserMenuPanel />
              </div>
            </Popover>
          ) : (
            <Link to="/login">
              <Button variant="secondary" size="sm">
                Sign In
              </Button>
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="p-1.5 rounded-lg hover:bg-surface transition-colors text-text-primary shrink-0"
            aria-label={mobileMenuOpen ? "Close site menu" : "Open site menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <FiX size={20} />
            ) : showSidebarToggle ? (
              <FiMoreVertical size={20} />
            ) : (
              <FiMenu size={20} />
            )}
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div
          className="fixed top-14 left-0 right-0 bottom-0 bg-black/50 z-[90] md:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      <div
        className={`
          fixed top-14 left-0 right-0
          bg-card border-b border-border shadow-lg
          z-[95]
          transition-transform duration-300 ease-in-out
          md:hidden
          ${mobileMenuOpen ? "translate-y-0" : "-translate-y-full pointer-events-none"}
          max-h-[calc(100vh-56px)] overflow-y-auto
        `}
      >
        <div className="px-4 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={closeMobileMenu}
              className="block px-4 py-3 rounded-lg text-text-primary no-underline text-sm font-medium hover:bg-surface-hover transition-colors"
            >
              {link.label}
            </Link>
          ))}

          {!showSidebarToggle && !user && (
            <>
              <div className="border-t border-border my-2" />
              <Link
                to="/register"
                onClick={closeMobileMenu}
                className="block px-4 py-3 rounded-lg bg-primary text-primary-text no-underline text-sm font-medium text-center hover:opacity-90 transition-opacity"
              >
                Get Started
              </Link>
            </>
          )}

          {!showSidebarToggle && user && (
            <>
              <div className="border-t border-border my-2" />
              <Link
                to={getDashboardPath(user.role)}
                onClick={closeMobileMenu}
                className="block px-4 py-3 rounded-lg text-text-primary no-underline text-sm font-medium hover:bg-surface-hover transition-colors"
              >
                Dashboard
              </Link>
              <Link
                to={getProfilePath(user.role)}
                onClick={closeMobileMenu}
                className="block px-4 py-3 rounded-lg text-text-primary no-underline text-sm font-medium hover:bg-surface-hover transition-colors"
              >
                Settings
              </Link>
              <button
                type="button"
                onClick={handleMobileLogout}
                className="w-full text-left px-4 py-3 rounded-lg text-danger text-sm font-medium hover:bg-surface-hover transition-colors"
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
