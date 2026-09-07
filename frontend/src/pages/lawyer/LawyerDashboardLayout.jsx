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
  FiSettings,
  FiLayers,
  FiCreditCard
} from "react-icons/fi";

export default function LawyerDashboardLayout() {
  const canUseAi = usePermission(PERMISSIONS.AI_USE);
  const canViewDocs = usePermission(PERMISSIONS.DOCS_VIEW);
  const canViewCases = usePermission(PERMISSIONS.CASES_VIEW);

  const menuItems = [
    { id: "overview", label: "Overview", icon: FiHome },
    {
      id: "billing",
      label: "Billing",
      icon: FiCreditCard,
      to: "/lawyer/billing/subscription",
      children: [
        {
          id: "billing-subscription",
          label: "Subscription",
          to: "/lawyer/billing/subscription",
          exact: true
        },
        {
          id: "billing-usage",
          label: "Usage",
          to: "/lawyer/billing/usage"
        },
        {
          id: "billing-invoices",
          label: "Invoices",
          to: "/lawyer/billing/invoices"
        }
      ]
    },
    {
      id: "workspace",
      label: "Workspace",
      icon: FiBriefcase,
      to: "/lawyer/workspace/overview"
    },
    ...(canViewCases ? [{ id: "cases", label: "Cases", icon: FiLayers }] : []),
    ...(canUseAi
      ? [
          {
            id: "ai-tools",
            label: "AI tools",
            icon: FiCpu,
            to: "/lawyer/ai",
            children: [
              {
                id: "ai",
                label: "AI Assistant",
                to: "/lawyer/ai",
                icon: FiCpu,
                exact: true
              },
              {
                id: "cross-exam",
                label: "Cross-Exam Practice",
                to: "/lawyer/cross-exam",
                icon: FiTarget
              }
            ]
          }
        ]
      : []),
    ...(canViewDocs ? [{ id: "documents", label: "Documents", icon: FiFolder }] : []),
    { id: "planner", label: "Smart Planner", icon: FiCalendar },
    { id: "availability", label: "Availability", icon: FiClock },
    { id: "bookings", label: "Bookings", icon: FiFileText },
    { id: "earnings", label: "Earnings", icon: FiDollarSign },
    { id: "verification", label: "Verification", icon: FiCheckCircle },
    { id: "reviews", label: "Reviews", icon: FiStar },
    {
      id: "settings",
      label: "Account settings",
      icon: FiSettings,
      to: "/lawyer/settings/profile"
    }
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
