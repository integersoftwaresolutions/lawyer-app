import { Outlet } from "react-router-dom";
import { DashboardLayout } from "../../components/layout";
import {
  FiHome,
  FiUser,
  FiClock,
  FiFileText,
  FiDollarSign,
  FiCheckCircle,
  FiStar,
  FiCpu
} from "react-icons/fi";

const menuItems = [
  { id: "overview", label: "Overview", icon: FiHome },
  { id: "ai", label: "AI Assistant", icon: FiCpu },
  { id: "availability", label: "Availability", icon: FiClock },
  { id: "bookings", label: "Bookings", icon: FiFileText },
  { id: "earnings", label: "Earnings", icon: FiDollarSign },
  { id: "verification", label: "Verification", icon: FiCheckCircle },
  { id: "reviews", label: "Reviews", icon: FiStar },
  { id: "profile", label: "My Profile", icon: FiUser }
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
