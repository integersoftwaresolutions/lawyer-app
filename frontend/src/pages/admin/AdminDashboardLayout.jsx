import { Outlet } from "react-router-dom";
import { DashboardLayout } from "../../components/layout";

const menuItems = [
  { id: "overview", label: "Overview", icon: "🏠" },
  { id: "lawyers", label: "Lawyers", icon: "👨‍⚖️" },
  { id: "users", label: "Users", icon: "👥" },
  { id: "bookings", label: "Bookings", icon: "📅" },
  { id: "verification", label: "Verification", icon: "✅" },
  { id: "settings", label: "Settings", icon: "⚙️" },
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
