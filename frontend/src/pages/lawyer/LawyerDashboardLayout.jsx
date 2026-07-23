import { Outlet } from "react-router-dom";
import { DashboardLayout } from "../../components/layout";
import {
  FiHome,
  FiSettings,
  FiCalendar,
  FiClock,
  FiFileText,
  FiDollarSign,
  FiCheckCircle,
  FiStar,
  FiCpu,
  FiTarget,
  FiFolder
} from "react-icons/fi";

const menuItems = [
  { id: "overview", label: "Overview", icon: FiHome },
  { id: "ai", label: "AI Assistant", icon: FiCpu },
  { id: "cross-exam", label: "Cross-Exam Practice", icon: FiTarget },
  { id: "documents", label: "My Documents", icon: FiFolder },
  { id: "planner", label: "Smart Planner", icon: FiCalendar },
  { id: "availability", label: "Availability", icon: FiClock },
  { id: "bookings", label: "Bookings", icon: FiFileText },
  { id: "earnings", label: "Earnings", icon: FiDollarSign },
  { id: "verification", label: "Verification", icon: FiCheckCircle },
  { id: "reviews", label: "Reviews", icon: FiStar },
  { id: "settings", label: "Settings", icon: FiSettings }
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
