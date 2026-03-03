import { Outlet } from "react-router-dom";
import { DashboardLayout } from "../../components/layout";
import { 
  FiHome, 
  FiBriefcase, 
  FiUsers, 
  FiCalendar, 
  FiCheckCircle, 
  FiSettings 
} from "react-icons/fi";

const menuItems = [
  { id: "overview", label: "Overview", icon: FiHome },
  { id: "lawyers", label: "Lawyers", icon: FiBriefcase },
  { id: "users", label: "Users", icon: FiUsers },
  { id: "bookings", label: "Bookings", icon: FiCalendar },
  { id: "verification", label: "Verification", icon: FiCheckCircle },
  { id: "settings", label: "Settings", icon: FiSettings },
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
