import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { FiArrowLeft } from "react-icons/fi";
import { Sidebar } from "../ui";
import DashboardNav from "./DashboardNav";
import SidebarUserFooter from "./SidebarUserFooter";
import Navbar from "./Navbar";
import WorkspaceSwitcher from "../workspace/WorkspaceSwitcher";
import { useWorkspace } from "../../hooks/useWorkspaceAccess";
import { acceptWorkspaceInvite, fetchWorkspaces } from "../../store/slices/workspaceSlice";
import { filterWorkspaceNavItems } from "../../workspaces/nav";
import { useToast } from "../../hooks/useToast";
import { getErrorMessage } from "../../utils/errorHandler";

export default function WorkspaceSettingsLayout() {
  const location = useLocation();
  const dispatch = useDispatch();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { workspace, isFirm, permissions } = useWorkspace();

  const menuItems = useMemo(
    () => filterWorkspaceNavItems({ isFirm, permissions }),
    [isFirm, permissions]
  );

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    dispatch(fetchWorkspaces());
  }, [dispatch]);

  useEffect(() => {
    const token = searchParams.get("invite");
    if (!token) return;
    (async () => {
      try {
        await dispatch(acceptWorkspaceInvite(token)).unwrap();
        toast.success("Joined firm");
        setSearchParams({}, { replace: true });
      } catch (err) {
        toast.error(getErrorMessage(err));
        setSearchParams({}, { replace: true });
      }
    })();
  }, [searchParams, dispatch, setSearchParams, toast]);

  return (
    <div className="h-screen bg-background text-text-primary flex flex-col overflow-hidden">
      <Navbar
        onSidebarToggle={() => setMobileOpen((v) => !v)}
        showSidebarToggle
        startSlot={<WorkspaceSwitcher variant="navbar" />}
        hideBrand
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
            to="/lawyer/overview"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 px-3 py-2 mb-2 rounded-lg text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary no-underline"
          >
            <FiArrowLeft className="w-4 h-4 shrink-0" />
            Dashboard
          </Link>
          <p className="px-3 pb-1.5 text-[10px] uppercase tracking-wide font-semibold text-text-muted m-0">
            {workspace?.name || "Workspace"}
          </p>
          <DashboardNav
            items={menuItems}
            basePath="/lawyer/workspace"
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
