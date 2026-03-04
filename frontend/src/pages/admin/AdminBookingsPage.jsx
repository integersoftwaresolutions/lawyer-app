import { useState } from "react";
import { adminApi } from "../../services/admin.api";
import { Card, Button, Badge, Table } from "../../components/ui";

export default function AdminBookingsPage() {
  const [filter, setFilter] = useState("");

  const fetchBookings = async () => {
    const params = filter ? { status: filter } : {};
    const res = await adminApi.getBookings(params);
    return res.data || [];
  };

  const getStatusBadge = (status) => {
    const variants = {
      BOOKED: "info",
      ACTIVE: "warning",
      COMPLETED: "success",
      CANCELLED: "danger",
      EXPIRED: "default",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
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
    <div>
      <Card>
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-text-primary m-0">
            All Bookings
          </h2>
          <div className="flex gap-2">
            {filterOptions.map((opt) => (
              <Button
                key={opt.value}
                variant={filter === opt.value ? "primary" : "secondary"}
                size="sm"
                onClick={() => setFilter(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        <Table
          columns={columns}
          data={fetchBookings}
          dependencies={[filter]}
          emptyMessage="No bookings found"
        />
      </Card>
    </div>
  );
}
