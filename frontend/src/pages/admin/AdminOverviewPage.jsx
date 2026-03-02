import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { adminApi } from "../../services/admin.api";
import { Card, Button, StatCard } from "../../components/ui";

export default function AdminOverviewPage() {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const res = await adminApi.getAnalytics();
      setAnalytics(res.data);
    } catch (error) {
      console.error("Failed to load analytics:", error);
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
          Platform Overview
        </h2>
        <p style={{ color: colors.text.secondary }}>
          Monitor and manage the lawyer marketplace platform
        </p>
      </Card>

      <h3 style={{ fontSize: "16px", fontWeight: "600", color: colors.text.primary, marginBottom: "16px" }}>
        Users
      </h3>
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", 
        gap: "16px", 
        marginBottom: "24px" 
      }}>
        <StatCard
          icon="👥"
          value={analytics?.users?.total || 0}
          label="Total Users"
        />
        <StatCard
          icon="👨‍⚖️"
          value={analytics?.users?.lawyers || 0}
          label="Lawyers"
        />
        <StatCard
          icon="👤"
          value={analytics?.users?.clients || 0}
          label="Clients"
        />
      </div>

      <h3 style={{ fontSize: "16px", fontWeight: "600", color: colors.text.primary, marginBottom: "16px" }}>
        Lawyers
      </h3>
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", 
        gap: "16px", 
        marginBottom: "24px" 
      }}>
        <StatCard
          icon="✅"
          value={analytics?.lawyers?.verified || 0}
          label="Verified Lawyers"
        />
        <StatCard
          icon="⏳"
          value={analytics?.lawyers?.pending || 0}
          label="Pending Verification"
        />
      </div>

      <h3 style={{ fontSize: "16px", fontWeight: "600", color: colors.text.primary, marginBottom: "16px" }}>
        Bookings & Revenue
      </h3>
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", 
        gap: "16px", 
        marginBottom: "24px" 
      }}>
        <StatCard
          icon="📅"
          value={analytics?.bookings?.total || 0}
          label="Total Bookings"
        />
        <StatCard
          icon="✅"
          value={analytics?.bookings?.completed || 0}
          label="Completed"
        />
        <StatCard
          icon="📊"
          value={analytics?.bookings?.thisMonth || 0}
          label="This Month"
        />
        <StatCard
          icon="💰"
          value={`$${analytics?.revenue?.total || 0}`}
          label="Total Revenue"
        />
        <StatCard
          icon="📈"
          value={`$${analytics?.revenue?.thisMonth || 0}`}
          label="Revenue This Month"
        />
        <StatCard
          icon="⭐"
          value={analytics?.reviews || 0}
          label="Total Reviews"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        <Card title="Quick Actions">
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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
          <div style={{ color: colors.text.secondary }}>
            <p style={{ marginBottom: "8px" }}>• {analytics?.bookings?.thisMonth || 0} bookings this month</p>
            <p style={{ marginBottom: "8px" }}>• {analytics?.lawyers?.pending || 0} lawyers awaiting verification</p>
            <p style={{ marginBottom: "8px" }}>• ${analytics?.revenue?.thisMonth || 0} revenue this month</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
