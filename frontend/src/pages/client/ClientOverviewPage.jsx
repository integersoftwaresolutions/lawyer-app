import { useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
import { clientApi } from "../../services/client.api";
import { walletApi } from "../../services/wallet.api";
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
  FiCreditCard, 
  FiBarChart2
} from "react-icons/fi";

export default function ClientOverviewPage() {
  const { user } = useAuth();
  
  const { loading, error, data, retry } = useStateHandler(
    async () => {
      const [statsRes, walletRes, bookingsRes, ledgerRes] = await Promise.all([
        clientApi.getMyStats(),
        walletApi.me(),
        clientApi.getMyBookings({ limit: 120 }),
        walletApi.ledger({ limit: 120 })
      ]);
      return {
        stats: statsRes.data,
        wallet: walletRes.data,
        bookings: bookingsRes.data || [],
        ledger: ledgerRes.data || []
      };
    }
  );

  const stats = data?.stats;
  const wallet = data?.wallet;
  const bookings = data?.bookings || [];
  const ledger = data?.ledger || [];

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

  const monthlyCreditFlow = useMemo(() => {
    const keys = getLastMonthKeys(6);
    const topupMap = new Map(keys.map((k) => [k, 0]));
    const spendMap = new Map(keys.map((k) => [k, 0]));
    ledger.forEach((entry) => {
      const dt = new Date(entry?.createdAt);
      if (Number.isNaN(dt.getTime())) return;
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      if (!topupMap.has(key)) return;
      const amount = Number(entry?.amount || 0);
      const type = String(entry?.type || "").toUpperCase();
      if (type === "TOPUP" || type === "CREDIT_GRANT") {
        topupMap.set(key, (topupMap.get(key) || 0) + Math.max(amount, 0));
      } else if (type === "SPEND") {
        spendMap.set(key, (spendMap.get(key) || 0) + Math.abs(amount));
      }
    });
    return keys.map((k) => ({
      month: monthLabel(k),
      "Credits In": Math.round(topupMap.get(k) || 0),
      "Credits Used": Math.round(spendMap.get(k) || 0)
    }));
  }, [ledger]);

  const completionRate = useMemo(() => {
    const total = Number(stats?.totalBookings || 0);
    const done = Number(stats?.completedBookings || 0);
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }, [stats]);

  return (
    <StateHandler loading={loading} error={error} retry={retry}>
      <PageShell>
        <PageHeader
          title={`Welcome back, ${user?.fullName || "Client"}`}
          subtitle="Quick snapshot of consultations and credits"
          meta={
            <>
              <div className="text-xs text-text-secondary break-all">{user?.email}</div>
              <div className="flex items-center sm:justify-end gap-2">
                <span className="text-xs text-text-muted">Role</span>
                <Badge size="sm" variant="info">
                  {user?.role || "CLIENT"}
                </Badge>
              </div>
              <div className="text-xs text-text-secondary">
                Monthly credits: {wallet?.monthlyCredits || 0}
              </div>
            </>
          }
        />

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
            value={`${completionRate}%`}
            label="Completion Rate"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <DashboardDonutChart
            title="Booking Mix"
            subtitle="Recent sessions by status"
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
              title="Credit Flow"
              subtitle="Top-ups versus usage over recent months"
              data={monthlyCreditFlow}
              xKey="month"
              bars={[
                { key: "Credits In", label: "Credits In", color: "var(--color-success)" },
                { key: "Credits Used", label: "Credits Used", color: "var(--color-accent)" }
              ]}
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
