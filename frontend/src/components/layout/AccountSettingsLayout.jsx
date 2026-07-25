import { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { FiArrowLeft, FiBell, FiLock, FiUser } from "react-icons/fi";
import { useSelector } from "react-redux";
import { Sidebar } from "../ui";
import DashboardNav from "./DashboardNav";
import SidebarUserFooter from "./SidebarUserFooter";
import Navbar from "./Navbar";
import WorkspaceSwitcher from "../workspace/WorkspaceSwitcher";
import { getDashboardPath } from "../../utils/authRoutes";

const FULL_ACCOUNT_ITEMS = [
  { id: "profile", label: "Profile", icon: FiUser },
  { id: "security", label: "Security", icon: FiLock },
  { id: "notifications", label: "Notifications", icon: FiBell }
];

const ADMIN_ACCOUNT_ITEMS = [
  { id: "security", label: "Security", icon: FiLock },
  { id: "notifications", label: "Notifications", icon: FiBell }
];

export default function AccountSettingsLayout({ basePath = "" }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useSelector((s) => s.auth.user);
  const role = user?.role;
  const isLawyer = role === "LAWYER";
  const isAdmin = role === "ADMIN";
  const dashboardPath = getDashboardPath(role);
  const settingsMenuItems = isAdmin ? ADMIN_ACCOUNT_ITEMS : FULL_ACCOUNT_ITEMS;

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="h-screen bg-background text-text-primary flex flex-col overflow-hidden">
      <Navbar
        onSidebarToggle={() => setMobileOpen((v) => !v)}
        showSidebarToggle
        startSlot={isLawyer ? <WorkspaceSwitcher variant="navbar" /> : null}
        hideBrand={isLawyer}
        hideMarketingLinks
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar
          isOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
          width="w-[240px]"
          contentClassName="p-2 md:p-3"
          footer={<SidebarUserFooter onNavigate={() => setMobileOpen(false)} />}
        >
          <Link
            to={dashboardPath}
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 px-3 py-2 mb-2 rounded-lg text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary no-underline"
          >
            <FiArrowLeft className="w-4 h-4 shrink-0" />
            Dashboard
          </Link>
          <p className="px-3 pb-1.5 text-[10px] uppercase tracking-wide font-semibold text-text-muted m-0">
            Account
          </p>
          <DashboardNav
            items={settingsMenuItems}
            basePath={basePath}
            onNavigate={() => setMobileOpen(false)}
          />
        </Sidebar>

        <main className="flex-1 min-w-0 min-h-0 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full p-3 sm:p-4 md:p-5 lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
