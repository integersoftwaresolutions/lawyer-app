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
      <div>
        <Card className="mb-6">
          <h2 className="text-2xl font-bold mb-2 text-text-primary">
            Platform Overview
          </h2>
          <p className="text-text-secondary">
            Monitor and manage the lawyer marketplace platform
          </p>
        </Card>

      <h3 className="text-base font-semibold text-text-primary mb-4">
        Users
      </h3>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-6">
        <StatCard
          icon={FiUsers}
          value={analytics?.users?.total || 0}
          label="Total Users"
        />
        <StatCard
          icon={FiBriefcase}
          value={analytics?.users?.lawyers || 0}
          label="Lawyers"
        />
        <StatCard
          icon={FiUser}
          value={analytics?.users?.clients || 0}
          label="Clients"
        />
      </div>

      <h3 className="text-base font-semibold text-text-primary mb-4">
        Lawyers
      </h3>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-6">
        <StatCard
          icon={FiCheckCircle}
          value={analytics?.lawyers?.verified || 0}
          label="Verified Lawyers"
        />
        <StatCard
          icon={FiClock}
          value={analytics?.lawyers?.pending || 0}
          label="Pending Verification"
        />
      </div>

      <h3 className="text-base font-semibold text-text-primary mb-4">
        Bookings & Revenue
      </h3>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-6">
        <StatCard
          icon={FiCalendar}
          value={analytics?.bookings?.total || 0}
          label="Total Bookings"
        />
        <StatCard
          icon={FiCheckCircle}
          value={analytics?.bookings?.completed || 0}
          label="Completed"
        />
        <StatCard
          icon={FiBarChart2}
          value={analytics?.bookings?.thisMonth || 0}
          label="This Month"
        />
        <StatCard
          icon={FiDollarSign}
          value={`$${analytics?.revenue?.total || 0}`}
          label="Total Revenue"
        />
        <StatCard
          icon={FiTrendingUp}
          value={`$${analytics?.revenue?.thisMonth || 0}`}
          label="Revenue This Month"
        />
        <StatCard
          icon={FiStar}
          value={analytics?.reviews || 0}
          label="Total Reviews"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card title="Quick Actions">
          <div className="flex flex-col gap-3">
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
          <div className="text-text-secondary">
            <p className="mb-2">• {analytics?.bookings?.thisMonth || 0} bookings this month</p>
            <p className="mb-2">• {analytics?.lawyers?.pending || 0} lawyers awaiting verification</p>
            <p className="mb-2">• ${analytics?.revenue?.thisMonth || 0} revenue this month</p>
          </div>
        </Card>
      </div>
      </div>
    </StateHandler>
  );
}
