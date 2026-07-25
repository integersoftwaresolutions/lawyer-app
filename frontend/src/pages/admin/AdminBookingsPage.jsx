import { useCallback, useState } from "react";
import { FiCalendar } from "react-icons/fi";
import { adminApi } from "../../services/admin.api";
import {
  Badge,
  DataList,
  DataTable,
  PageFilters,
  PageHeader,
  PageShell,
  PageTabFilters,
  Pagination
} from "../../components/ui";
import { usePaginatedQuery } from "../../hooks/usePaginatedQuery";

export default function AdminBookingsPage() {
  const [filter, setFilter] = useState("");

  const fetchBookings = useCallback(
    (params) => adminApi.getBookings({ ...params, ...(filter ? { status: filter } : {}) }),
    [filter]
  );

  const { items, meta, setPage, loading, error, retry } = usePaginatedQuery(fetchBookings, {
    dependencies: [filter],
    defaultLimit: 20
  });

  const BOOKING_STATUS_LABELS = {
    BOOKED: "Booked",
    ACTIVE: "Active",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    EXPIRED: "Expired"
  };

  const getStatusBadge = (status) => {
    const variants = {
      BOOKED: "info",
      ACTIVE: "warning",
      COMPLETED: "success",
      CANCELLED: "danger",
      EXPIRED: "default"
    };
    return (
      <Badge variant={variants[status] || "default"} size="table">
        {BOOKING_STATUS_LABELS[status] || status}
      </Badge>
    );
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

  const filterOptions = [
    { value: "", label: "All" },
    { value: "BOOKED", label: "Booked" },
    { value: "ACTIVE", label: "Active" },
    { value: "COMPLETED", label: "Completed" },
    { value: "CANCELLED", label: "Cancelled" }
  ];

  const columns = [
    {
      key: "clientId",
      label: "Client",
      render: (_, row) => row.clientId?.email || "N/A"
    },
    {
      key: "lawyerUserId",
      label: "Lawyer",
      render: (_, row) => row.lawyerUserId?.email || "N/A"
    },
    {
      key: "startAt",
      label: "Date & time",
      render: (value) => formatDate(value)
    },
    {
      key: "durationMinutes",
      label: "Duration",
      render: (value) => `${value} min`
    },
    {
      key: "amount",
      label: "Amount",
      render: (value) => `$${value || 0}`
    },
    {
      key: "platformFee",
      label: "Platform fee",
      hideOnMobile: true,
      render: (value) => `$${value || 0}`
    },
    {
      key: "status",
      label: "Status",
      render: (value) => getStatusBadge(value)
    }
  ];

  return (
    <PageShell>
      <PageHeader
        icon={FiCalendar}
        title="All Bookings"
        subtitle="Monitor every consultation on the platform"
      />
      <DataList
        filters={
          <PageFilters>
            <PageTabFilters options={filterOptions} value={filter} onChange={setFilter} />
          </PageFilters>
        }
        pagination={<Pagination meta={meta} onPageChange={setPage} />}
      >
        <DataTable
          columns={columns}
          data={items}
          keyField="_id"
          loading={loading}
          error={error}
          retry={retry}
          emptyMessage="No bookings found"
          emptyDescription="Try a different status filter."
        />
      </DataList>
    </PageShell>
  );
}
