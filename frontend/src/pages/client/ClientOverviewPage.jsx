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
      <div>
        <Card className="mb-6">
          <h2 className="text-2xl font-bold mb-2 text-text-primary">
            Welcome back!
          </h2>
          <p className="text-text-secondary">
            Manage your legal consultations and connect with expert lawyers
          </p>
        </Card>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-6">
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

        <div className="grid grid-cols-2 gap-6">
          <Card title="Quick Actions">
            <div className="flex flex-col gap-3">
              <Button fullWidth onClick={() => navigate("/client/search")}>
                Find Lawyers
              </Button>
              <Button variant="secondary" fullWidth onClick={() => navigate("/client/bookings")}>
                View My Bookings
              </Button>
              <Button variant="secondary" fullWidth onClick={() => navigate("/client/wallet")}>
                Manage Wallet
              </Button>
            </div>
          </Card>

          <Card title="Account Info">
            <div className="text-text-secondary">
              <p className="mb-2">
                <strong>Email:</strong> {user?.email}
              </p>
              <p className="mb-2">
                <strong>Role:</strong> {user?.role}
              </p>
              <p className="mb-2">
                <strong>Monthly Credits:</strong> {wallet?.monthlyCredits || 0}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </StateHandler>
  );
}
