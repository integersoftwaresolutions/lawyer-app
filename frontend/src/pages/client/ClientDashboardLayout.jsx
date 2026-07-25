import { Outlet } from "react-router-dom";
import { DashboardLayout } from "../../components/layout";
import { 
  FiHome, 
  FiCalendar, 
  FiCreditCard, 
  FiStar, 
  FiSettings
} from "react-icons/fi";

const menuItems = [
  { id: "overview", label: "Overview", icon: FiHome },
  { id: "bookings", label: "My Bookings", icon: FiCalendar },
  { id: "wallet", label: "Wallet & Credits", icon: FiCreditCard },
  { id: "reviews", label: "My Reviews", icon: FiStar },
  { id: "settings", label: "Account settings", icon: FiSettings },
];

export default function ClientDashboardLayout() {
  return (
    <DashboardLayout
      title="Client Dashboard"
      menuItems={menuItems}
      basePath="/client"
      hideMarketingLinks
    >
      <Outlet />
    </DashboardLayout>
  );
}
