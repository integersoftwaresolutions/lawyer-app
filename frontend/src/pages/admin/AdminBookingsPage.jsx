import { useState } from "react";
import { FiCalendar } from "react-icons/fi";
import { adminApi } from "../../services/admin.api";
import {
  Badge,
  PageHeader,
  PageShell,
  PageTabFilters,
  Table
} from "../../components/ui";

export default function AdminBookingsPage() {
  const [filter, setFilter] = useState("");

  const fetchBookings = async () => {
    const params = filter ? { status: filter } : {};
    const res = await adminApi.getBookings(params);
    return res.data || [];
  };

  const BOOKING_STATUS_LABELS = {
    BOOKED: "Booked",
    ACTIVE: "Active",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    EXPIRED: "Expired",
  };

  const getStatusBadge = (status) => {
    const variants = {
      BOOKED: "info",
      ACTIVE: "warning",
      COMPLETED: "success",
      CANCELLED: "danger",
      EXPIRED: "default",
    };
    return (
      <Badge variant={variants[status] || "default"} size="table">
        {BOOKING_STATUS_LABELS[status] || status}
      </Badge>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filterOptions = [
    { value: "", label: "All" },
    { value: "BOOKED", label: "Booked" },
    { value: "ACTIVE", label: "Active" },
    { value: "COMPLETED", label: "Completed" },
    { value: "CANCELLED", label: "Cancelled" },
  ];

  const columns = [
    {
      key: "clientId",
      label: "Client",
      render: (_, row) => row.clientId?.email || "N/A",
    },
    {
      key: "lawyerUserId",
      label: "Lawyer",
      render: (_, row) => row.lawyerUserId?.email || "N/A",
    },
    {
      key: "startAt",
      label: "Date & Time",
      render: (value) => formatDate(value),
    },
    {
      key: "durationMinutes",
      label: "Duration",
      render: (value) => `${value} min`,
    },
    {
      key: "amount",
      label: "Amount",
      render: (value) => `$${value || 0}`,
    },
    {
      key: "platformFee",
      label: "Platform Fee",
      render: (value) => `$${value || 0}`,
    },
    {
      key: "status",
      label: "Status",
      render: (value) => getStatusBadge(value),
    },
  ];

  return (
    <PageShell>
      <PageHeader
        icon={FiCalendar}
        title="All Bookings"
        subtitle="Monitor every consultation on the platform"
      />
      <PageTabFilters options={filterOptions} value={filter} onChange={setFilter} />
      <Table
        columns={columns}
        data={fetchBookings}
        dependencies={[filter]}
        emptyMessage="No bookings found"
      />
    </PageShell>
  );
}
