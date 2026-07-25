import { useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
import { adminApi } from "../../services/admin.api";
import { Badge, PageHeader, PageShell, StatCard, StateHandler } from "../../components/ui";
import { useStateHandler } from "../../hooks/useStateHandler";
import {
  DashboardAreaTrendChart,
  DashboardBarChart,
  DashboardDonutChart
} from "../../components/dashboard/DashboardCharts";
import {
  FiUsers,
  FiCalendar,
  FiDollarSign,
  FiClock
} from "react-icons/fi";

export default function AdminOverviewPage() {
  const { user } = useAuth();

  const { loading, error, data, retry } = useStateHandler(async () => {
    const [analyticsRes, bookingsRes] = await Promise.all([
      adminApi.getAnalytics(),
      adminApi.getBookings({ limit: 120 })
    ]);
    return {
      analytics: analyticsRes.data,
      bookings: bookingsRes.items || []
    };
  });

  const analytics = data?.analytics;
  const bookings = data?.bookings || [];

  const userMixData = useMemo(
    () => [
      { name: "Clients", value: analytics?.users?.clients || 0, color: "var(--color-info)" },
      { name: "Lawyers", value: analytics?.users?.lawyers || 0, color: "var(--color-primary)" }
    ],
    [analytics]
  );

  const lawyerVerificationData = useMemo(
    () => [
      { name: "Verified", value: analytics?.lawyers?.verified || 0, color: "var(--color-success)" },
      { name: "Pending", value: analytics?.lawyers?.pending || 0, color: "var(--color-warning)" }
    ],
    [analytics]
  );

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
      { name: "Upcoming", value: counts.BOOKED + counts.ACTIVE, color: "var(--color-info)" },
      { name: "Completed", value: counts.COMPLETED, color: "var(--color-success)" },
      { name: "Cancelled", value: counts.CANCELLED + counts.EXPIRED, color: "var(--color-danger)" }
    ];
  }, [bookings]);

  const monthlyBookingTrend = useMemo(
    () => buildMonthlyCountTrend(bookings, "createdAt", 6, "Bookings"),
    [bookings]
  );

  const monthlyRevenueTrend = useMemo(
    () => buildMonthlyPlatformRevenue(bookings, 6),
    [bookings]
  );

  const completionRate = useMemo(() => {
    const total = Number(analytics?.bookings?.total || 0);
    const done = Number(analytics?.bookings?.completed || 0);
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }, [analytics]);

  return (
    <StateHandler loading={loading} error={error} retry={retry}>
      <PageShell>
        <PageHeader
          title={`Welcome back, ${user?.fullName || "Admin"}`}
          subtitle="Platform snapshot of users, bookings, and revenue"
          meta={
            <>
              <div className="text-xs text-text-secondary break-all">{user?.email}</div>
              <div className="flex items-center sm:justify-end gap-2">
                <span className="text-xs text-text-muted">Role</span>
                <Badge size="sm" variant="info">
                  {user?.role || "ADMIN"}
                </Badge>
              </div>
              <div className="text-xs text-text-secondary">
                {analytics?.reviews || 0} reviews · {completionRate}% booking completion
              </div>
            </>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            icon={FiUsers}
            value={analytics?.users?.total || 0}
            label="Total Users"
          />
          <StatCard
            icon={FiCalendar}
            value={analytics?.bookings?.total || 0}
            label="Total Bookings"
          />
          <StatCard
            icon={FiDollarSign}
            value={`$${analytics?.revenue?.total || 0}`}
            label="Total Revenue"
          />
          <StatCard
            icon={FiClock}
            value={analytics?.lawyers?.pending || 0}
            label="Pending Verifications"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <DashboardDonutChart
            title="User Mix"
            subtitle="Clients versus lawyers on the platform"
            data={userMixData}
          />
          <DashboardDonutChart
            title="Lawyer Verification"
            subtitle="Verified and pending lawyer profiles"
            data={lawyerVerificationData}
          />
          <DashboardDonutChart
            title="Booking Mix"
            subtitle="Recent bookings by status"
            data={bookingStatusData}
          />
          <DashboardAreaTrendChart
            title="Booking Trend"
            subtitle="Bookings created over last 6 months"
            data={monthlyBookingTrend}
            xKey="month"
            series={[{ key: "Bookings", label: "Bookings", color: "var(--color-primary)" }]}
          />
          <div className="lg:col-span-2">
            <DashboardBarChart
              title="Platform Revenue"
              subtitle="Completed booking fees over recent months"
              data={monthlyRevenueTrend}
              xKey="month"
              bars={[{ key: "Revenue", label: "Revenue", color: "var(--color-accent)" }]}
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

function buildMonthlyPlatformRevenue(rows, months) {
  const keys = getLastMonthKeys(months);
  const map = new Map(keys.map((k) => [k, 0]));
  rows.forEach((row) => {
    if ((row?.status || "").toUpperCase() !== "COMPLETED") return;
    const dt = new Date(row?.createdAt);
    if (Number.isNaN(dt.getTime())) return;
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    if (!map.has(key)) return;
    const fee = Number(row?.platformFee || 0);
    if (fee > 0) map.set(key, (map.get(key) || 0) + fee);
  });
  return keys.map((k) => ({ month: monthLabel(k), Revenue: Math.round(map.get(k) || 0) }));
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
