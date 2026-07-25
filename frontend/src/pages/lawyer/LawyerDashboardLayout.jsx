import { Outlet } from "react-router-dom";
import { DashboardLayout } from "../../components/layout";
import WorkspaceSwitcher from "../../components/workspace/WorkspaceSwitcher";
import { usePermission } from "../../hooks/useWorkspaceAccess";
import { PERMISSIONS } from "../../workspaces/permissions";
import {
  FiHome,
  FiCalendar,
  FiClock,
  FiFileText,
  FiDollarSign,
  FiCheckCircle,
  FiStar,
  FiCpu,
  FiTarget,
  FiFolder,
  FiBriefcase,
  FiSettings
} from "react-icons/fi";

export default function LawyerDashboardLayout() {
  const canUseAi = usePermission(PERMISSIONS.AI_USE);
  const canViewDocs = usePermission(PERMISSIONS.DOCS_VIEW);

  const menuItems = [
    { id: "overview", label: "Overview", icon: FiHome },
    { id: "workspace", label: "Workspace", icon: FiBriefcase },
    ...(canUseAi
      ? [
          { id: "ai", label: "AI Assistant", icon: FiCpu },
          { id: "cross-exam", label: "Cross-Exam Practice", icon: FiTarget }
        ]
      : []),
    ...(canViewDocs ? [{ id: "documents", label: "Documents", icon: FiFolder }] : []),
    { id: "planner", label: "Smart Planner", icon: FiCalendar },
    { id: "availability", label: "Availability", icon: FiClock },
    { id: "bookings", label: "Bookings", icon: FiFileText },
    { id: "earnings", label: "Earnings", icon: FiDollarSign },
    { id: "verification", label: "Verification", icon: FiCheckCircle },
    { id: "reviews", label: "Reviews", icon: FiStar },
    { id: "settings", label: "Account settings", icon: FiSettings }
  ];

  return (
    <DashboardLayout
      title="Lawyer Dashboard"
      menuItems={menuItems}
      basePath="/lawyer"
      navbarStart={<WorkspaceSwitcher variant="navbar" />}
      hideBrand
      hideMarketingLinks
    >
      <Outlet />
    </DashboardLayout>
  );
}
