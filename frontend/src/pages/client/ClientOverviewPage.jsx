import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { clientApi } from "../../services/client.api";
import { walletApi } from "../../services/wallet.api";
import { Card, Button, StatCard, StateHandler } from "../../components/ui";
import { useStateHandler } from "../../hooks/useStateHandler";
import { 
  FiCalendar, 
  FiCheckCircle, 
  FiCreditCard, 
  FiBarChart2 
} from "react-icons/fi";

export default function ClientOverviewPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { loading, error, data, retry } = useStateHandler(
    async () => {
      const [statsRes, walletRes] = await Promise.all([
        clientApi.getMyStats(),
        walletApi.me()
      ]);
      return {
        stats: statsRes.data,
        wallet: walletRes.data,
      };
    }
  );

  const stats = data?.stats;
  const wallet = data?.wallet;

  return (
    <StateHandler loading={loading} error={error} retry={retry}>
      <div className="space-y-4 sm:space-y-6">
        <Card padding="p-4 sm:p-5 md:p-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 text-text-primary">
            Welcome back!
          </h2>
          <p className="text-sm sm:text-base text-text-secondary">
            Manage your legal consultations and connect with expert lawyers
          </p>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            icon={FiCalendar}
            value={stats?.upcomingBookings || 0}
            label="Upcoming Sessions"
          />
          <StatCard
            icon={FiCheckCircle}
            value={stats?.completedBookings || 0}
            label="Completed Sessions"
          />
          <StatCard
            icon={FiCreditCard}
            value={wallet?.balanceCredits || 0}
            label="Credits Balance"
          />
          <StatCard
            icon={FiBarChart2}
            value={stats?.totalBookings || 0}
            label="Total Bookings"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card title="Quick Actions">
            <div className="flex flex-col gap-2 sm:gap-3">
              <Button variant="secondary" fullWidth onClick={() => navigate("/client/bookings")}>
                View My Bookings
              </Button>
              <Button variant="secondary" fullWidth onClick={() => navigate("/client/wallet")}>
                Manage Wallet
              </Button>
            </div>
          </Card>

          <Card title="Account Info">
            <div className="text-text-secondary space-y-3 text-sm sm:text-base">
              <p className="m-0 break-words">
                <strong className="text-text-primary">Email:</strong> {user?.email}
              </p>
              <p className="m-0">
                <strong className="text-text-primary">Role:</strong> {user?.role}
              </p>
              <p className="m-0">
                <strong className="text-text-primary">Monthly Credits:</strong> {wallet?.monthlyCredits || 0}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </StateHandler>
  );
}
