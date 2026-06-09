import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { lawyerApi } from "../../services/lawyer.api";
import { Card, Button, StatCard, StateHandler, Badge } from "../../components/ui";
import { useStateHandler } from "../../hooks/useStateHandler";
import { useToast } from "../../hooks/useToast";
import { 
  FiCalendar, 
  FiDollarSign, 
  FiStar, 
  FiUsers 
} from "react-icons/fi";

export default function LawyerOverviewPage() {
  const navigate = useNavigate();

  const toast = useToast();
  const [boostLoading, setBoostLoading] = useState(false);
  
  const { loading, error, data, retry } = useStateHandler(
    async () => {
      const [statsRes, profileRes, boostRes] = await Promise.all([
        lawyerApi.getMyStats(),
        lawyerApi.getMyProfile(),
        lawyerApi.getMyProfileBoostInfo(),
      ]);
      return {
        stats: statsRes.data,
        profile: profileRes.data,
        boost: boostRes.data
      };
    }
  );

  const stats = data?.stats;
  const profile = data?.profile;
  const boost = data?.boost;

  const handlePurchaseBoost = async (durationDays) => {
    if (boostLoading) return;
    const fee =
      durationDays === 7 ? boost?.pricing?.fee7Days : boost?.pricing?.fee30Days;
    if (!fee || fee <= 0) {
      toast.error("This boost package is not available right now");
      return;
    }

    if (profile?.verificationStatus !== "APPROVED") {
      toast.error("You must be verified to buy profile boosts");
      return;
    }

    try {
      setBoostLoading(true);
      await lawyerApi.purchaseProfileBoost(durationDays);
      toast.success("Profile boost purchased successfully");
      retry();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to purchase boost");
    } finally {
      setBoostLoading(false);
    }
  };

  return (
    <StateHandler loading={loading} error={error} retry={retry}>
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
            icon={FiCalendar}
            value={stats?.upcomingBookings || 0}
            label="Upcoming Sessions"
          />
          <StatCard
            icon={FiDollarSign}
            value={`$${stats?.totalEarnings || 0}`}
            label="Total Earnings"
          />
          <StatCard
            icon={FiStar}
            value={stats?.ratingAvg?.toFixed(1) || "0.0"}
            label={`Rating (${stats?.ratingCount || 0} reviews)`}
          />
          <StatCard
            icon={FiUsers}
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

          <Card title="Profile Boost" className="col-span-2">
            <div className="text-text-secondary">
              <div className="flex justify-between items-center mb-3">
                <span>Featured</span>
                {boost?.boost?.isFeatured ? (
                  <Badge variant="warning" size="sm">
                    Featured until{" "}
                    {boost?.boost?.featuredUntil
                      ? new Date(boost.boost.featuredUntil).toLocaleDateString("en-US")
                      : "N/A"}
                  </Badge>
                ) : (
                  <Badge variant="default" size="sm">
                    Not Featured
                  </Badge>
                )}
              </div>

              <div className="flex gap-3 flex-wrap">
                <Button
                  variant="primary"
                  disabled={
                    boostLoading ||
                    profile?.verificationStatus !== "APPROVED" ||
                    !(boost?.pricing?.fee7Days > 0)
                  }
                  onClick={() => handlePurchaseBoost(7)}
                >
                  Boost 7 days (${boost?.pricing?.fee7Days || 0})
                </Button>
                <Button
                  variant="secondary"
                  disabled={
                    boostLoading ||
                    profile?.verificationStatus !== "APPROVED" ||
                    !(boost?.pricing?.fee30Days > 0)
                  }
                  onClick={() => handlePurchaseBoost(30)}
                >
                  Boost 30 days (${boost?.pricing?.fee30Days || 0})
                </Button>
              </div>

              {profile?.verificationStatus !== "APPROVED" && (
                <p className="text-xs text-text-muted mt-3 m-0">
                  Boost purchase is available after verification approval.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </StateHandler>
  );
}
