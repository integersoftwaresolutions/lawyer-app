import { Outlet } from "react-router-dom";
import { DashboardLayout } from "../../components/layout";

const menuItems = [
  { id: "overview", label: "Overview", icon: "🏠" },
  { id: "profile", label: "My Profile", icon: "👤" },
  { id: "availability", label: "Availability", icon: "📅" },
  { id: "bookings", label: "Bookings", icon: "📋" },
  { id: "earnings", label: "Earnings", icon: "💰" },
  { id: "verification", label: "Verification", icon: "✅" },
  { id: "reviews", label: "Reviews", icon: "⭐" },
];

export default function LawyerDashboardLayout() {
  return (
    <DashboardLayout
      title="Lawyer Dashboard"
      menuItems={menuItems}
      basePath="/lawyer"
    >
      <Outlet />
    </DashboardLayout>
  );
}
