import { Outlet } from "react-router-dom";
import { DashboardLayout } from "../../components/layout";
import {
  FiHome,
  FiBriefcase,
  FiUsers,
  FiCalendar,
  FiCheckCircle,
  FiSettings,
  FiAlertCircle,
  FiBookOpen,
  FiLayers,
  FiCreditCard
} from "react-icons/fi";

const menuItems = [
  { id: "overview", label: "Overview", icon: FiHome },
  { id: "workspaces", label: "Workspaces", icon: FiLayers },
  {
    id: "subscriptions",
    label: "Subscriptions",
    icon: FiCreditCard,
    children: [
      {
        id: "subscriptions-all",
        label: "All workspaces",
        to: "/admin/subscriptions",
        exact: true
      },
      {
        id: "subscriptions-catalog",
        label: "Plan catalog",
        to: "/admin/subscriptions/catalog"
      }
    ]
  },
  { id: "lawyers", label: "Lawyers", icon: FiBriefcase },
  { id: "users", label: "Users", icon: FiUsers },
  { id: "bookings", label: "Bookings", icon: FiCalendar },
  { id: "disputes", label: "Disputes", icon: FiAlertCircle },
  { id: "verification", label: "Verification", icon: FiCheckCircle },
  { id: "case-law", label: "Case Law", icon: FiBookOpen },
  { id: "settings", label: "Platform settings", icon: FiSettings }
];

export default function AdminDashboardLayout() {
  return (
    <DashboardLayout
      title="Admin Dashboard"
      menuItems={menuItems}
      basePath="/admin"
    >
      <Outlet />
    </DashboardLayout>
  );
}
