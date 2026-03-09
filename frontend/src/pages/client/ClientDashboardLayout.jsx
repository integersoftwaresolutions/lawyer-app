import { Outlet } from "react-router-dom";
import { DashboardLayout } from "../../components/layout";
import { 
  FiHome, 
  FiCalendar, 
  FiCreditCard, 
  FiStar, 
  FiUser 
} from "react-icons/fi";

const menuItems = [
  { id: "overview", label: "Overview", icon: FiHome },
  { id: "bookings", label: "My Bookings", icon: FiCalendar },
  { id: "wallet", label: "Wallet & Credits", icon: FiCreditCard },
  { id: "reviews", label: "My Reviews", icon: FiStar },
  { id: "profile", label: "My Profile", icon: FiUser },
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
