import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Sidebar } from "../ui";
import DashboardNav from "./DashboardNav";
import SidebarUserFooter from "./SidebarUserFooter";
import Navbar from "./Navbar";

function isChatPagePath(pathname) {
  // Keep chat-like pages in a fixed-height container so their internal
  // scroll regions don't cause layout reflow while loading.
  return /\/(ai|cross-exam)\/?$/.test(pathname);
}

export default function DashboardLayout({
  children,
  menuItems = [],
  basePath = "",
  sidebarHeader = null,
  navbarStart = null,
  hideBrand = false,
  hideMarketingLinks = false
}) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isChatPage = isChatPagePath(location.pathname);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="h-screen bg-background text-text-primary flex flex-col overflow-hidden">
      <Navbar
        onSidebarToggle={() => setMobileOpen((v) => !v)}
        showSidebarToggle
        startSlot={navbarStart}
        hideBrand={hideBrand || Boolean(navbarStart)}
        hideMarketingLinks={hideMarketingLinks}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar
          isOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
          width="w-[280px]"
          contentClassName="p-2 md:p-3"
          footer={<SidebarUserFooter onNavigate={() => setMobileOpen(false)} />}
        >
          {sidebarHeader}
          <DashboardNav
            items={menuItems}
            basePath={basePath}
            onNavigate={() => setMobileOpen(false)}
          />
        </Sidebar>

        <main
          className={`flex-1 min-w-0 min-h-0 ${
            isChatPage ? "overflow-hidden" : "overflow-y-auto"
          }`}
        >
          <div
            className={`max-w-7xl mx-auto w-full p-3 sm:p-4 md:p-5 lg:p-6 ${
              isChatPage ? "h-full min-h-0 flex flex-col" : ""
            }`}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
