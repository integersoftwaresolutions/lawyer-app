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

function StatusRow({ label, children }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className="text-sm font-semibold text-text-primary sm:text-right">{children}</span>
    </div>
  );
}

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

  const verificationClass =
    profile?.verificationStatus === "APPROVED"
      ? "text-success"
      : profile?.verificationStatus === "REJECTED"
        ? "text-danger"
        : "text-warning";

  return (
    <StateHandler loading={loading} error={error} retry={retry}>
      <div className="space-y-4 sm:space-y-6">
        <Card padding="p-4 sm:p-5 md:p-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 text-text-primary">
            Welcome back, {profile?.fullName || "Lawyer"}!
          </h2>
          <p className="text-sm sm:text-base text-text-secondary">
            Manage your profile, bookings, and earnings
          </p>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card title="Quick Actions">
            <div className="flex flex-col gap-2 sm:gap-3">
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
            <div>
              <StatusRow label="Verification Status">
                <span className={verificationClass}>
                  {profile?.verificationStatus || "PENDING"}
                </span>
              </StatusRow>
              <StatusRow label="Hourly Rate">
                ${profile?.hourlyRate || 0}/hr
              </StatusRow>
              <StatusRow label="Experience">
                {profile?.experienceYears || 0} years
              </StatusRow>
              <StatusRow label="Specializations">
                {profile?.specialization?.length || 0}
              </StatusRow>
            </div>
          </Card>

          <Card title="Profile Boost" className="lg:col-span-2">
            <div className="text-text-secondary space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-text-secondary">Featured</span>
                {boost?.boost?.isFeatured ? (
                  <Badge variant="warning" size="sm" className="w-fit">
                    Featured until{" "}
                    {boost?.boost?.featuredUntil
                      ? new Date(boost.boost.featuredUntil).toLocaleDateString("en-US")
                      : "N/A"}
                  </Badge>
                ) : (
                  <Badge variant="default" size="sm" className="w-fit">
                    Not Featured
                  </Badge>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                  variant="primary"
                  fullWidth
                  className="sm:w-auto sm:min-w-[10rem]"
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
                  fullWidth
                  className="sm:w-auto sm:min-w-[10rem]"
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
                <p className="text-xs text-text-muted m-0">
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
