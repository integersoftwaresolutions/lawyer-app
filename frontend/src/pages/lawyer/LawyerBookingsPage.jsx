import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiEye,
  FiEdit2,
  FiPlay,
  FiMessageCircle,
  FiCheck,
  FiTrash2,
  FiAlertTriangle
} from "react-icons/fi";
import { lawyerApi } from "../../services/lawyer.api";
import { bookingApi } from "../../services/booking.api";
import {
  Card,
  Button,
  Badge,
  Modal,
  Input,
  Select,
  Textarea,
  Table,
  FilterTabs,
  ActionMenu,
  IconButton
} from "../../components/ui";
import { usePaginatedQuery } from "../../hooks/usePaginatedQuery";

const SLOT_DURATION_MINUTES = 30;

const getTodayIso = () => {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export default function LawyerBookingsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [viewModal, setViewModal] = useState({ open: false, booking: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, booking: null });
  const [editModal, setEditModal] = useState({ open: false, booking: null });
  const [editData, setEditData] = useState({ date: "", slot: "" });
  const [editSlots, setEditSlots] = useState([]);
  const [editSlotsLoading, setEditSlotsLoading] = useState(false);
  const [disputeModal, setDisputeModal] = useState({ open: false, booking: null });
  const [disputeViewModal, setDisputeViewModal] = useState({ open: false, booking: null });
  const [disputeData, setDisputeData] = useState({ reason: "OTHER", description: "" });
  const [refreshKey, setRefreshKey] = useState(0);

  const DISPUTE_RESOLUTION_LABELS = {
    REFUND_CLIENT_FULL: "Full Refund to Client",
    REFUND_CLIENT_PARTIAL: "Partial Refund to Client",
    NO_ACTION: "No Action",
    WARNING_LAWYER: "Warning to Lawyer",
    DISMISSED: "Dismissed"
  };

  const DISPUTE_REASON_LABELS = {
    NO_SHOW: "No show",
    POOR_SERVICE: "Poor service",
    BILLING_ISSUE: "Billing issue",
    TECHNICAL_ISSUE: "Technical issue",
    OTHER: "Other"
  };

  const DISPUTE_REASONS = [
    { value: "NO_SHOW", label: "Client didn't show up" },
    { value: "POOR_SERVICE", label: "Client misconduct" },
    { value: "BILLING_ISSUE", label: "Billing / payment issue" },
    { value: "TECHNICAL_ISSUE", label: "Technical problem" },
    { value: "OTHER", label: "Other" }
  ];

  const fetchBookings = useCallback(
    (params) =>
      lawyerApi.getMyBookings({
        ...params,
        ...(filter ? { status: filter } : {})
      }),
    [filter]
  );

  const { items, meta, setPage, loading, error, retry } = usePaginatedQuery(fetchBookings, {
    dependencies: [filter, refreshKey],
    defaultLimit: 10
  });

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
    const currentTime = toTimeInputValue(booking.startAt);
    const [h, m] = currentTime.split(":").map(Number);
    const endM = h * 60 + m + SLOT_DURATION_MINUTES;
    const hh = String(Math.floor((endM % 1440) / 60)).padStart(2, "0");
    const mm = String(endM % 60).padStart(2, "0");
    const currentSlotValue = `${currentTime}-${hh}:${mm}`;

    setEditData({
      date: toDateInputValue(booking.startAt),
      slot: currentSlotValue
    });
    setEditSlots([]);
    setEditModal({ open: true, booking });
  };

  const loadEditSlots = async () => {
    if (!editModal.booking || !editData.date) return;
    if (editData.date < getTodayIso()) {
      alert("Please select today's date or a future date");
      return;
    }
    try {
      setEditSlotsLoading(true);
      const lawyerId = editModal.booking.lawyerUserId?._id || editModal.booking.lawyerUserId;
      const res = await lawyerApi.getAvailableSlots(lawyerId, editData.date);
      setEditSlots(res.data || []);
    } catch (error) {
      console.error("Failed to load slots:", error);
      alert(error.response?.data?.message || "Failed to load available slots");
    } finally {
      setEditSlotsLoading(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!editModal.booking) return;
    if (!editData.date || !editData.slot) {
      alert("Please select a date and an available slot");
      return;
    }
    if (editData.date < getTodayIso()) {
      alert("You cannot reschedule to a date in the past");
      return;
    }

    const [slotStart] = editData.slot.split("-");
    const startAtIso = new Date(`${editData.date}T${slotStart}:00`).toISOString();

    try {
      setSubmitting(true);
      await lawyerApi.rescheduleMyBooking(editModal.booking._id, {
        startAt: startAtIso,
        durationMinutes: SLOT_DURATION_MINUTES
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

  const handleDisputeSubmit = async () => {
    if (!disputeModal.booking) return;
    try {
      setSubmitting(true);
      await lawyerApi.raiseDispute(disputeModal.booking._id, {
        reason: disputeData.reason,
        description: disputeData.description
      });
      setDisputeModal({ open: false, booking: null });
      setDisputeData({ reason: "OTHER", description: "" });
      setRefreshKey((k) => k + 1);
      alert("Dispute raised. Our team will review it shortly.");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to raise dispute");
    } finally {
      setSubmitting(false);
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
      label: "Your Earning",
      render: (value) => `$${value || 0}`,
    },
    {
      key: "status",
      label: "Status",
      render: (value) => getStatusBadge(value),
    },
    {
      key: "dispute",
      label: "Dispute",
      render: (_, row) =>
        row.status === "COMPLETED" ? (
          row.dispute ? (
            <button
              type="button"
              onClick={() => setDisputeViewModal({ open: true, booking: row })}
              className="inline-flex items-center gap-2 rounded-lg border border-card-border bg-surface/50 px-2.5 py-1.5 text-left transition-colors hover:bg-surface-hover hover:border-primary/30"
            >
              <Badge variant={row.dispute.status === "RESOLVED" ? "success" : "info"} size="table">
                {row.dispute.status.replace(/_/g, " ")}
              </Badge>
            </button>
          ) : (
            <Button
              size="xs"
              variant="warning"
              outline
              icon={FiAlertTriangle}
              onClick={() => setDisputeModal({ open: true, booking: row })}
            >
              Dispute
            </Button>
          )
        ) : (
          <span className="text-text-muted text-sm">—</span>
        )
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      className: "whitespace-nowrap",
      render: (_, row) => (
        <ActionMenu>
          {isViewable(row) && (
            <IconButton
              icon={FiEye}
              label="View booking"
              variant="secondary"
              outline
              size="icon-sm"
              onClick={() => setViewModal({ open: true, booking: row })}
            />
          )}
          {isViewable(row) && row.status === "BOOKED" && (
            <IconButton
              icon={FiEdit2}
              label="Edit booking"
              variant="secondary"
              outline
              size="icon-sm"
              onClick={() => handleOpenEdit(row)}
            />
          )}
          {row.status === "BOOKED" && (
            <Button
              size="xs"
              variant="primary"
              icon={FiPlay}
              onClick={() => handleActivate(row._id)}
            >
              Start
            </Button>
          )}
          {row.status === "ACTIVE" && (
            <>
              <Button
                size="xs"
                variant="primary"
                outline
                icon={FiMessageCircle}
                onClick={() => navigate(`/chat/${row._id}`)}
              >
                Chat
              </Button>
              <Button
                size="xs"
                variant="success"
                outline
                icon={FiCheck}
                onClick={() => handleComplete(row._id)}
              >
                Done
              </Button>
            </>
          )}
          <IconButton
            icon={FiTrash2}
            label="Delete booking"
            variant="danger"
            outline
            size="icon-sm"
            onClick={() => setDeleteModal({ open: true, booking: row })}
          />
        </ActionMenu>
      )
    },
  ];

  return (
    <div>
      <Card padding="p-0" className="overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 border-b border-card-border">
          <h2 className="text-lg font-bold text-text-primary m-0">My Bookings</h2>
          <FilterTabs options={filterOptions} value={filter} onChange={setFilter} />
        </div>

        <Table
          columns={columns}
          data={items}
          loading={loading}
          error={error}
          retry={retry}
          density="compact"
          className="border-0 rounded-none shadow-none"
          emptyMessage="No bookings found"
          pagination={{
            currentPage: meta.page,
            totalPages: meta.pages,
            totalItems: meta.total,
            itemsPerPage: meta.limit,
            onPageChange: setPage
          }}
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
        <Input
          label="Date"
          type="date"
          min={getTodayIso()}
          value={editData.date}
          onChange={(e) => {
            setEditData((p) => ({ ...p, date: e.target.value, slot: "" }));
            setEditSlots([]);
          }}
        />
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
          <Button
            variant="secondary"
            size="sm"
            loading={editSlotsLoading}
            onClick={loadEditSlots}
            disabled={!editData.date}
          >
            Load Slots
          </Button>
          <div className="text-text-secondary text-xs">
            Pick one of your available 30-minute slots.
          </div>
        </div>
        <Select
          label="Available Slots (30 minutes each)"
          value={editData.slot}
          onChange={(e) => setEditData((p) => ({ ...p, slot: e.target.value }))}
          placeholder={
            editData.date
              ? editSlots.length
                ? "Select a slot"
                : "No slots — click Load Slots"
              : "Select date first"
          }
          options={(editSlots || []).map((s) => ({
            value: `${s.start}-${s.end}`,
            label: `${s.start} - ${s.end}`
          }))}
        />
        <p className="mt-2 mb-0 text-text-muted text-xs">
          Tip: Editing is allowed only for upcoming bookings. All sessions are 30 minutes.
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

      <Modal
        isOpen={disputeModal.open}
        onClose={() => setDisputeModal({ open: false, booking: null })}
        title="Raise a Dispute"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDisputeModal({ open: false, booking: null })}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDisputeSubmit} loading={submitting}>
              Submit Dispute
            </Button>
          </>
        }
      >
        <p className="text-text-secondary text-sm mb-4 mt-0">
          If you had an issue with this consultation, you can raise a dispute. Our admin team will review it.
        </p>
        <Select
          label="Reason"
          value={disputeData.reason}
          onChange={(e) => setDisputeData((d) => ({ ...d, reason: e.target.value }))}
          options={DISPUTE_REASONS}
          containerClassName="mb-4"
        />
        <Textarea
          label="Description (optional)"
          placeholder="Describe what happened..."
          value={disputeData.description}
          onChange={(e) => setDisputeData((d) => ({ ...d, description: e.target.value }))}
          rows={3}
        />
      </Modal>

      <Modal
        isOpen={disputeViewModal.open}
        onClose={() => setDisputeViewModal({ open: false, booking: null })}
        title="Dispute Details"
        footer={
          <Button variant="secondary" onClick={() => setDisputeViewModal({ open: false, booking: null })}>
            Close
          </Button>
        }
      >
        {disputeViewModal.booking?.dispute && (
          <div className="text-text-primary space-y-3">
            <p className="m-0"><strong>Status:</strong> {disputeViewModal.booking.dispute.status.replace(/_/g, " ")}</p>
            <p className="m-0"><strong>Reason:</strong> {DISPUTE_REASON_LABELS[disputeViewModal.booking.dispute.reason] || disputeViewModal.booking.dispute.reason}</p>
            {disputeViewModal.booking.dispute.description && (
              <p className="m-0"><strong>Description:</strong> {disputeViewModal.booking.dispute.description}</p>
            )}
            {disputeViewModal.booking.dispute.status === "RESOLVED" && disputeViewModal.booking.dispute.resolution && (
              <>
                <p className="m-0"><strong>Resolution:</strong> {DISPUTE_RESOLUTION_LABELS[disputeViewModal.booking.dispute.resolution] || disputeViewModal.booking.dispute.resolution.replace(/_/g, " ")}</p>
                {disputeViewModal.booking.dispute.refundAmount > 0 && (
                  <p className="m-0"><strong>Refund to Client:</strong> ${disputeViewModal.booking.dispute.refundAmount}</p>
                )}
                {disputeViewModal.booking.dispute.resolutionNote && (
                  <p className="m-0 text-text-secondary"><strong>Admin Note:</strong> {disputeViewModal.booking.dispute.resolutionNote}</p>
                )}
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
