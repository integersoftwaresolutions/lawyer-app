import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../hooks/useAuth";
import { clientApi } from "../../services/client.api";
import { walletApi } from "../../services/wallet.api";
import { Card, Button, StatCard } from "../../components/ui";

export default function ClientOverviewPage() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, walletRes] = await Promise.all([
        clientApi.getMyStats(),
        walletApi.me()
      ]);
      setStats(statsRes.data);
      setWallet(walletRes.data);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: "24px", color: colors.text.secondary }}>Loading...</div>;
  }

  return (
    <div>
      <Card style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px", color: colors.text.primary }}>
          Welcome back!
        </h2>
        <p style={{ color: colors.text.secondary }}>
          Manage your legal consultations and connect with expert lawyers
        </p>
      </Card>

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
        gap: "16px", 
        marginBottom: "24px" 
      }}>
        <StatCard
          icon="📅"
          value={stats?.upcomingBookings || 0}
          label="Upcoming Sessions"
        />
        <StatCard
          icon="✅"
          value={stats?.completedBookings || 0}
          label="Completed Sessions"
        />
        <StatCard
          icon="💳"
          value={wallet?.balanceCredits || 0}
          label="Credits Balance"
        />
        <StatCard
          icon="📊"
          value={stats?.totalBookings || 0}
          label="Total Bookings"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        <Card title="Quick Actions">
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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
          <div style={{ color: colors.text.secondary }}>
            <p style={{ marginBottom: "8px" }}>
              <strong>Email:</strong> {user?.email}
            </p>
            <p style={{ marginBottom: "8px" }}>
              <strong>Role:</strong> {user?.role}
            </p>
            <p style={{ marginBottom: "8px" }}>
              <strong>Monthly Credits:</strong> {wallet?.monthlyCredits || 0}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
