import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { lawyerApi } from "../../services/lawyer.api";
import { Card, Button, StatCard } from "../../components/ui";

export default function LawyerOverviewPage() {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, profileRes] = await Promise.all([
        lawyerApi.getMyStats(),
        lawyerApi.getMyProfile()
      ]);
      setStats(statsRes.data);
      setProfile(profileRes.data);
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
          Welcome back, {profile?.fullName || "Lawyer"}!
        </h2>
        <p style={{ color: colors.text.secondary }}>
          Manage your profile, bookings, and earnings
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
          icon="💰"
          value={`$${stats?.totalEarnings || 0}`}
          label="Total Earnings"
        />
        <StatCard
          icon="⭐"
          value={stats?.ratingAvg?.toFixed(1) || "0.0"}
          label={`Rating (${stats?.ratingCount || 0} reviews)`}
        />
        <StatCard
          icon="👥"
          value={stats?.totalConsultations || 0}
          label="Total Consultations"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        <Card title="Quick Actions">
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Button fullWidth onClick={() => navigate("/lawyer/profile")}>
              Edit Profile
            </Button>
            <Button variant="secondary" fullWidth onClick={() => navigate("/lawyer/availability")}>
              Set Availability
            </Button>
            <Button variant="secondary" fullWidth onClick={() => navigate("/lawyer/bookings")}>
              View Bookings
            </Button>
          </div>
        </Card>

        <Card title="Profile Status">
          <div style={{ color: colors.text.secondary }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
              <span>Verification Status:</span>
              <span style={{ 
                color: profile?.verificationStatus === "APPROVED" ? "#28a745" : 
                       profile?.verificationStatus === "REJECTED" ? "#dc3545" : "#ffc107",
                fontWeight: "600"
              }}>
                {profile?.verificationStatus || "PENDING"}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
              <span>Hourly Rate:</span>
              <span style={{ fontWeight: "600", color: colors.text.primary }}>
                ${profile?.hourlyRate || 0}/hr
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
              <span>Experience:</span>
              <span style={{ fontWeight: "600", color: colors.text.primary }}>
                {profile?.experienceYears || 0} years
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Specializations:</span>
              <span style={{ fontWeight: "600", color: colors.text.primary }}>
                {profile?.specialization?.length || 0}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
