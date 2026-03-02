import { Outlet } from "react-router-dom";
import { DashboardLayout } from "../../components/layout";

const menuItems = [
  { id: "overview", label: "Overview", icon: "🏠" },
  { id: "search", label: "Find Lawyers", icon: "🔍" },
  { id: "bookings", label: "My Bookings", icon: "📅" },
  { id: "wallet", label: "Wallet & Credits", icon: "💳" },
  { id: "reviews", label: "My Reviews", icon: "⭐" },
  { id: "profile", label: "My Profile", icon: "👤" },
];

export default function ClientDashboardLayout() {
  return (
    <DashboardLayout
      title="Client Dashboard"
      menuItems={menuItems}
      basePath="/client"
    >
      <Outlet />
    </DashboardLayout>
  );
}
