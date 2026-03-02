import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { lawyerApi } from "../../services/lawyer.api";
import { Card, Button, StatCard } from "../../components/ui";

export default function LawyerOverviewPage() {
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
    return <div className="p-6 text-text-secondary">Loading...</div>;
  }

  return (
    <div>
      <Card className="mb-6">
        <h2 className="text-2xl font-bold mb-2 text-text-primary">
          Welcome back, {profile?.fullName || "Lawyer"}!
        </h2>
        <p className="text-text-secondary">
          Manage your profile, bookings, and earnings
        </p>
      </Card>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-6">
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

      <div className="grid grid-cols-2 gap-6">
        <Card title="Quick Actions">
          <div className="flex flex-col gap-3">
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
          <div className="text-text-secondary">
            <div className="flex justify-between mb-3">
              <span>Verification Status:</span>
              <span className={`font-semibold ${
                profile?.verificationStatus === "APPROVED" ? "text-success" : 
                profile?.verificationStatus === "REJECTED" ? "text-danger" : "text-warning"
              }`}>
                {profile?.verificationStatus || "PENDING"}
              </span>
            </div>
            <div className="flex justify-between mb-3">
              <span>Hourly Rate:</span>
              <span className="font-semibold text-text-primary">
                ${profile?.hourlyRate || 0}/hr
              </span>
            </div>
            <div className="flex justify-between mb-3">
              <span>Experience:</span>
              <span className="font-semibold text-text-primary">
                {profile?.experienceYears || 0} years
              </span>
            </div>
            <div className="flex justify-between">
              <span>Specializations:</span>
              <span className="font-semibold text-text-primary">
                {profile?.specialization?.length || 0}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
