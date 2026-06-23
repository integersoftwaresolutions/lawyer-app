import { useNavigate } from "react-router-dom";
import { adminApi } from "../../services/admin.api";
import { Card, Button, StatCard, StateHandler } from "../../components/ui";
import { useStateHandler } from "../../hooks/useStateHandler";
import { 
  FiUsers, 
  FiBriefcase, 
  FiUser, 
  FiCheckCircle, 
  FiClock, 
  FiCalendar, 
  FiDollarSign, 
  FiBarChart2, 
  FiTrendingUp, 
  FiStar 
} from "react-icons/fi";

function SectionTitle({ children }) {
  return (
    <h3 className="text-sm sm:text-base font-semibold text-text-primary mb-3 sm:mb-4">
      {children}
    </h3>
  );
}

export default function AdminOverviewPage() {
  const navigate = useNavigate();
  
  const { loading, error, data, retry } = useStateHandler(
    async () => {
      const res = await adminApi.getAnalytics();
      return res.data;
    }
  );

  const analytics = data;

  return (
    <StateHandler loading={loading} error={error} retry={retry}>
      <div className="space-y-4 sm:space-y-6">
        <Card padding="p-4 sm:p-5 md:p-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 text-text-primary">
            Platform Overview
          </h2>
          <p className="text-sm sm:text-base text-text-secondary">
            Monitor and manage the lawyer marketplace platform
          </p>
        </Card>

        <section>
          <SectionTitle>Users</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <StatCard icon={FiUsers} value={analytics?.users?.total || 0} label="Total Users" />
            <StatCard icon={FiBriefcase} value={analytics?.users?.lawyers || 0} label="Lawyers" />
            <StatCard icon={FiUser} value={analytics?.users?.clients || 0} label="Clients" />
          </div>
        </section>

        <section>
          <SectionTitle>Lawyers</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <StatCard icon={FiCheckCircle} value={analytics?.lawyers?.verified || 0} label="Verified Lawyers" />
            <StatCard icon={FiClock} value={analytics?.lawyers?.pending || 0} label="Pending Verification" />
          </div>
        </section>

        <section>
          <SectionTitle>Bookings & Revenue</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            <StatCard icon={FiCalendar} value={analytics?.bookings?.total || 0} label="Total Bookings" />
            <StatCard icon={FiCheckCircle} value={analytics?.bookings?.completed || 0} label="Completed" />
            <StatCard icon={FiBarChart2} value={analytics?.bookings?.thisMonth || 0} label="This Month" />
            <StatCard icon={FiDollarSign} value={`$${analytics?.revenue?.total || 0}`} label="Total Revenue" />
            <StatCard icon={FiTrendingUp} value={`$${analytics?.revenue?.thisMonth || 0}`} label="Revenue This Month" />
            <StatCard icon={FiStar} value={analytics?.reviews || 0} label="Total Reviews" />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card title="Quick Actions">
            <div className="flex flex-col gap-2 sm:gap-3">
              <Button fullWidth onClick={() => navigate("/admin/verification")}>
                Review Pending Lawyers ({analytics?.lawyers?.pending || 0})
              </Button>
              <Button variant="secondary" fullWidth onClick={() => navigate("/admin/lawyers")}>
                Manage Lawyers
              </Button>
              <Button variant="secondary" fullWidth onClick={() => navigate("/admin/settings")}>
                Platform Settings
              </Button>
            </div>
          </Card>

          <Card title="Recent Activity">
            <div className="text-text-secondary space-y-2 text-sm sm:text-base">
              <p className="m-0">• {analytics?.bookings?.thisMonth || 0} bookings this month</p>
              <p className="m-0">• {analytics?.lawyers?.pending || 0} lawyers awaiting verification</p>
              <p className="m-0">• ${analytics?.revenue?.thisMonth || 0} revenue this month</p>
            </div>
          </Card>
        </div>
      </div>
    </StateHandler>
  );
}
