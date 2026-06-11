import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

/** Routes where the nav sidebar auto-collapses (expands on hover). */
function isAutoCollapsePath(pathname) {
  return /\/(ai)\/?$/.test(pathname);
}

export default function DashboardLayout({
  children,
  menuItems = [],
  basePath = ""
}) {
  const location = useLocation();
  const autoCollapse = useMemo(
    () => isAutoCollapsePath(location.pathname),
    [location.pathname]
  );

  const [pinned, setPinned] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isExpanded = pinned || hovered || !collapsed;

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (autoCollapse) {
      setPinned(false);
      setCollapsed(true);
      setHovered(false);
    } else if (!pinned) {
      setCollapsed(false);
    }
  }, [autoCollapse, location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTogglePin = useCallback(() => {
    if (isExpanded && (pinned || !collapsed)) {
      setPinned(false);
      setCollapsed(true);
      setHovered(false);
    } else {
      setPinned(true);
      setCollapsed(false);
    }
  }, [isExpanded, pinned, collapsed]);

  const handleSidebarEnter = useCallback(() => {
    if (collapsed && !pinned) setHovered(true);
  }, [collapsed, pinned]);

  const handleSidebarLeave = useCallback(() => {
    setHovered(false);
  }, []);

  const isChatPage = autoCollapse;

  return (
    <div className="h-screen bg-background text-text-primary flex flex-col overflow-hidden">
      <Navbar
        variant="slim"
        onSidebarToggle={() => setMobileOpen((v) => !v)}
        showSidebarToggle
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar
          items={menuItems}
          basePath={basePath}
          expanded={isExpanded}
          pinned={pinned}
          onTogglePin={handleTogglePin}
          onMouseEnter={handleSidebarEnter}
          onMouseLeave={handleSidebarLeave}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />

        <main
          className={`flex-1 min-w-0 min-h-0 ${
            isChatPage
              ? "overflow-hidden p-2 sm:p-3 md:p-4"
              : "overflow-y-auto p-3 md:p-5"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
