import { useMemo } from "react";
import { lawyerApi } from "../../services/lawyer.api";
import { Badge, PageHeader, PageShell, StatCard, StateHandler } from "../../components/ui";
import { useStateHandler } from "../../hooks/useStateHandler";
import {
  DashboardAreaTrendChart,
  DashboardBarChart,
  DashboardDonutChart
} from "../../components/dashboard/DashboardCharts";
import {
  FiCalendar,
  FiCheckCircle,
  FiDollarSign,  
  FiStar,
  FiUsers
} from "react-icons/fi";

export default function LawyerOverviewPage() {
  const { loading, error, data, retry } = useStateHandler(
    async () => {
      const [statsRes, profileRes, bookingsRes, earningsRes] = await Promise.all([
        lawyerApi.getMyStats(),
        lawyerApi.getMyProfile(),
        lawyerApi.getMyBookings({ limit: 120 }),
        lawyerApi.getMyEarnings({ limit: 120 })
      ]);
      return {
        stats: statsRes.data,
        profile: profileRes.data,
        bookings: bookingsRes.data || [],
        earnings: earningsRes.data || []
      };
    }
  );

  const stats = data?.stats;
  const profile = data?.profile;
  const bookings = data?.bookings || [];
  const earnings = data?.earnings || [];

  const verificationClass =
    profile?.verificationStatus === "APPROVED"
      ? "text-success"
      : profile?.verificationStatus === "REJECTED"
        ? "text-danger"
        : "text-warning";

  const bookingStatusData = useMemo(() => {
    const counts = {
      BOOKED: 0,
      ACTIVE: 0,
      COMPLETED: 0,
      CANCELLED: 0,
      EXPIRED: 0
    };
    bookings.forEach((b) => {
      const status = (b?.status || "").toUpperCase();
      if (counts[status] != null) counts[status] += 1;
    });
    return [
      { name: "Upcoming", value: counts.BOOKED, color: "var(--color-info)" },
      { name: "Active", value: counts.ACTIVE, color: "var(--color-warning)" },
      { name: "Completed", value: counts.COMPLETED, color: "var(--color-success)" },
      { name: "Cancelled", value: counts.CANCELLED + counts.EXPIRED, color: "var(--color-danger)" }
    ];
  }, [bookings]);

  const monthlyConsultationTrend = useMemo(
    () => buildMonthlyCountTrend(bookings, "startAt", 6, "Consultations"),
    [bookings]
  );

  const monthlyEarningsTrend = useMemo(
    () => buildMonthlySumTrend(earnings, "createdAt", "amount", 6, "Earnings"),
    [earnings]
  );

  const completed = Number(stats?.completedBookings || 0);
  const total = Number(stats?.totalConsultations || 0);
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <StateHandler loading={loading} error={error} retry={retry}>
      <PageShell>
        <PageHeader
          title={`Welcome back, ${profile?.fullName || "Lawyer"}`}
          subtitle="Quick snapshot of practice performance"
          meta={
            <>
              <div className="flex items-center sm:justify-end gap-2">
                <span className="text-xs text-text-muted">Verification</span>
                <span className={`text-xs font-semibold ${verificationClass}`}>
                  {profile?.verificationStatus || "PENDING"}
                </span>
              </div>
              <div className="text-xs text-text-secondary flex items-center sm:justify-end gap-2">
                <span>${profile?.hourlyRate || 0}/hr</span>
                <span className="text-text-muted">•</span>
                <span>{profile?.experienceYears || 0} years</span>
              </div>
              {profile?.isFeatured && (
                <div className="flex sm:justify-end">
                  <Badge size="sm" variant="warning">
                    Featured
                  </Badge>
                </div>
              )}
            </>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <StatCard icon={FiCalendar} value={stats?.upcomingBookings || 0} label="Upcoming Sessions" />
          <StatCard
            icon={FiDollarSign}
            value={`$${stats?.totalEarnings || 0}`}
            label="Total Earnings"
          />
          <StatCard icon={FiUsers} value={stats?.totalConsultations || 0} label="Total Consultations" />
          <StatCard icon={FiCheckCircle} value={`${completionRate}%`} label="Completion Rate" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <DashboardDonutChart
            title="Booking Mix"
            subtitle="Distribution of recent session statuses"
            data={bookingStatusData}
          />
          <DashboardAreaTrendChart
            title="Consultation Trend"
            subtitle="Sessions completed over last 6 months"
            data={monthlyConsultationTrend}
            xKey="month"
            series={[{ key: "Consultations", label: "Consultations", color: "var(--color-primary)" }]}
          />
          <div className="lg:col-span-2">
            <DashboardBarChart
              title="Monthly Earnings"
              subtitle="Gross earning flow for recent months"
              data={monthlyEarningsTrend}
              xKey="month"
              bars={[{ key: "Earnings", label: "Earnings", color: "var(--color-accent)" }]}
              valueFormatter={(v) => `$${v}`}
            />
          </div>
        </div>
      </PageShell>
    </StateHandler>
  );
}

function buildMonthlyCountTrend(rows, dateKey, months, valueKey) {
  const keys = getLastMonthKeys(months);
  const map = new Map(keys.map((k) => [k, 0]));
  rows.forEach((row) => {
    const dt = new Date(row?.[dateKey]);
    if (Number.isNaN(dt.getTime())) return;
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    if (map.has(key)) map.set(key, (map.get(key) || 0) + 1);
  });
  return keys.map((k) => ({ month: monthLabel(k), [valueKey]: map.get(k) || 0 }));
}

function buildMonthlySumTrend(rows, dateKey, amountKey, months, valueKey) {
  const keys = getLastMonthKeys(months);
  const map = new Map(keys.map((k) => [k, 0]));
  rows.forEach((row) => {
    const dt = new Date(row?.[dateKey]);
    if (Number.isNaN(dt.getTime())) return;
    const amount = Number(row?.[amountKey] || 0);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    if (map.has(key) && amount > 0) {
      map.set(key, (map.get(key) || 0) + amount);
    }
  });
  return keys.map((k) => ({ month: monthLabel(k), [valueKey]: Math.round(map.get(k) || 0) }));
}

function getLastMonthKeys(months) {
  const now = new Date();
  const out = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

function monthLabel(key) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString([], { month: "short" });
}
