import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { lawyerApi } from "../../services/lawyer.api";
import { bookingApi } from "../../services/booking.api";
import { Card, Button, Badge, Modal, Input, Select, Table } from "../../components/ui";

export default function LawyerBookingsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [viewModal, setViewModal] = useState({ open: false, booking: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, booking: null });
  const [editModal, setEditModal] = useState({ open: false, booking: null });
  const [editData, setEditData] = useState({ date: "", time: "", durationMinutes: 30 });
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchBookings = async () => {
    const params = filter ? { status: filter } : {};
    const res = await lawyerApi.getMyBookings(params);
    return res.data || [];
  };

  const handleDelete = async () => {
    if (!deleteModal.booking) return;
    try {
      setSubmitting(true);
      await lawyerApi.deleteMyBooking(deleteModal.booking._id);
      setDeleteModal({ open: false, booking: null });
      setRefreshKey((k) => k + 1);
    } catch (error) {
      console.error("Failed to delete booking:", error);
      alert(error.response?.data?.message || "Failed to delete booking");
    } finally {
      setSubmitting(false);
    }
  };

  const toDateInputValue = (d) => {
    const dt = new Date(d);
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const toTimeInputValue = (d) => {
    const dt = new Date(d);
    const hh = String(dt.getHours()).padStart(2, "0");
    const mm = String(dt.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  };

  const isViewable = (booking) => {
    return booking.status !== "COMPLETED";
  };

  const handleOpenEdit = (booking) => {
    setEditData({
      date: toDateInputValue(booking.startAt),
      time: toTimeInputValue(booking.startAt),
      durationMinutes: booking.durationMinutes || 30
    });
    setEditModal({ open: true, booking });
  };

  const handleEditSubmit = async () => {
    if (!editModal.booking) return;
    if (!editData.date || !editData.time) {
      alert("Please select a date and time");
      return;
    }

    const startAtIso = new Date(`${editData.date}T${editData.time}:00`).toISOString();

    try {
      setSubmitting(true);
      await lawyerApi.rescheduleMyBooking(editModal.booking._id, {
        startAt: startAtIso,
        durationMinutes: Number(editData.durationMinutes)
      });
      setEditModal({ open: false, booking: null });
      setRefreshKey((k) => k + 1);
    } catch (error) {
      console.error("Failed to edit booking:", error);
      alert(error.response?.data?.message || "Failed to edit booking");
    } finally {
      setSubmitting(false);
    }
  };

  const handleActivate = async (bookingId) => {
    try {
      await bookingApi.activate(bookingId);
      setRefreshKey((k) => k + 1);
    } catch (error) {
      console.error("Failed to activate:", error);
      alert(error.response?.data?.message || "Failed to activate session");
    }
  };

  const handleComplete = async (bookingId) => {
    try {
      await bookingApi.complete(bookingId);
      setRefreshKey((k) => k + 1);
    } catch (error) {
      console.error("Failed to complete:", error);
      alert(error.response?.data?.message || "Failed to complete session");
    }
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
    { value: "BOOKED", label: "Upcoming" },
    { value: "ACTIVE", label: "Active" },
    { value: "COMPLETED", label: "Completed" },
  ];

  const columns = [
    {
      key: "clientId",
      label: "Client",
      render: (_, row) => row.clientId?.email || "N/A",
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
      key: "consultationType",
      label: "Type",
      render: (value) => value || "CHAT",
    },
    {
      key: "lawyerEarning",
      label: "Amount",
      render: (value) => `$${value || 0}`,
    },
    {
      key: "status",
      label: "Status",
      render: (value) => getStatusBadge(value),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <div className="flex gap-2 flex-wrap">
          {isViewable(row) && (
            <>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setViewModal({ open: true, booking: row })}
              >
                View
              </Button>
              {row.status === "BOOKED" && (
                <Button size="sm" variant="secondary" onClick={() => handleOpenEdit(row)}>
                  Edit
                </Button>
              )}
            </>
          )}

          {row.status === "BOOKED" && (
            <Button size="sm" onClick={() => handleActivate(row._id)}>
              Start Session
            </Button>
          )}

          {row.status === "ACTIVE" && (
            <>
              <Button size="sm" onClick={() => navigate(`/chat/${row._id}`)}>
                Join Chat
              </Button>
              <Button size="sm" variant="secondary" onClick={() => handleComplete(row._id)}>
                Complete
              </Button>
            </>
          )}

          <Button size="sm" variant="danger" onClick={() => setDeleteModal({ open: true, booking: row })}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-text-primary m-0">
            My Bookings
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
          dependencies={[filter, refreshKey]}
          emptyMessage="No bookings found"
        />
      </Card>

      <Modal
        isOpen={viewModal.open}
        onClose={() => setViewModal({ open: false, booking: null })}
        title="Booking Details"
        footer={
          <Button variant="secondary" onClick={() => setViewModal({ open: false, booking: null })}>
            Close
          </Button>
        }
      >
        {viewModal.booking && (
          <div className="text-text-primary">
            <div className="mb-2.5">
              <strong>Client:</strong> {viewModal.booking.clientId?.email || "N/A"}
            </div>
            <div className="mb-2.5">
              <strong>Date & Time:</strong> {formatDate(viewModal.booking.startAt)}
            </div>
            <div className="mb-2.5">
              <strong>Duration:</strong> {viewModal.booking.durationMinutes} minutes
            </div>
            <div className="mb-2.5">
              <strong>Type:</strong> {viewModal.booking.consultationType || "CHAT"}
            </div>
            <div className="mb-2.5">
              <strong>Status:</strong> {viewModal.booking.status}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false, booking: null })}
        title="Edit Booking"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditModal({ open: false, booking: null })}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} loading={submitting}>
              Save Changes
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Date"
            type="date"
            value={editData.date}
            onChange={(e) => setEditData((p) => ({ ...p, date: e.target.value }))}
            containerStyle={{ marginBottom: 0 }}
          />
          <Input
            label="Time"
            type="time"
            step="900"
            value={editData.time}
            onChange={(e) => setEditData((p) => ({ ...p, time: e.target.value }))}
            containerStyle={{ marginBottom: 0 }}
          />
        </div>

        <Select
          label="Duration"
          value={editData.durationMinutes}
          onChange={(e) => setEditData((p) => ({ ...p, durationMinutes: parseInt(e.target.value) }))}
          options={[
            { value: 15, label: "15 minutes" },
            { value: 30, label: "30 minutes" },
            { value: 45, label: "45 minutes" },
            { value: 60, label: "60 minutes" },
            { value: 90, label: "90 minutes" },
            { value: 120, label: "120 minutes" },
          ]}
          placeholder="Select duration"
          containerStyle={{ marginTop: "16px" }}
        />
        <p className="mt-2 mb-0 text-text-muted text-xs">
          Tip: Editing is allowed only for upcoming bookings. The new time must fit your availability.
        </p>
      </Modal>

      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, booking: null })}
        title="Delete Booking"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteModal({ open: false, booking: null })}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={submitting}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-text-secondary mt-0">
          This will remove the booking from your dashboard history.
        </p>
      </Modal>
    </div>
  );
}
