import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { FiBell, FiLock, FiUser } from "react-icons/fi";
import { Sidebar } from "../ui";
import DashboardNav from "./DashboardNav";
import SidebarUserFooter from "./SidebarUserFooter";
import Navbar from "./Navbar";

const settingsMenuItems = [
  { id: "profile", label: "Profile", icon: FiUser },
  { id: "security", label: "Security", icon: FiLock },
  { id: "notifications", label: "Notifications", icon: FiBell }
];

export default function AccountSettingsLayout({ basePath = "" }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="h-screen bg-background text-text-primary flex flex-col overflow-hidden">
      <Navbar
        onSidebarToggle={() => setMobileOpen((v) => !v)}
        showSidebarToggle
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar
          isOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
          title="Account Settings"
          width="w-[240px]"
          contentClassName="p-2 md:p-3"
          footer={<SidebarUserFooter onNavigate={() => setMobileOpen(false)} />}
        >
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
