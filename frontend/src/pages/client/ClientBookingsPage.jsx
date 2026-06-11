import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiEye,
  FiEdit2,
  FiMessageCircle,
  FiStar,
  FiTrash2,
  FiAlertTriangle
} from "react-icons/fi";
import { clientApi } from "../../services/client.api";
import {
  Card,
  Button,
  Badge,
  Modal,
  Textarea,
  Input,
  Select,
  Table,
  FilterTabs,
  ActionMenu,
  IconButton
} from "../../components/ui";
import { usePaginatedQuery } from "../../hooks/usePaginatedQuery";

export default function ClientBookingsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("");
  const [reviewModal, setReviewModal] = useState({ open: false, booking: null });
  const [reviewData, setReviewData] = useState({ rating: 5, comment: "" });
  const [submitting, setSubmitting] = useState(false);
  const [viewModal, setViewModal] = useState({ open: false, booking: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, booking: null });
  const [editModal, setEditModal] = useState({ open: false, booking: null });
  const [editData, setEditData] = useState({ date: "", time: "", durationMinutes: 30 });
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
    { value: "NO_SHOW", label: "Lawyer didn't show up" },
    { value: "POOR_SERVICE", label: "Poor service" },
    { value: "BILLING_ISSUE", label: "Billing issue" },
    { value: "TECHNICAL_ISSUE", label: "Technical problem" },
    { value: "OTHER", label: "Other" }
  ];

  const fetchBookings = useCallback(
    (params) =>
      clientApi.getMyBookings({
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
      await clientApi.deleteMyBooking(deleteModal.booking._id);
      setDeleteModal({ open: false, booking: null });
      setRefreshKey((k) => k + 1);
    } catch (error) {
      console.error("Failed to delete booking:", error);
      alert(error.response?.data?.message || "Failed to delete booking");
    } finally {
      setSubmitting(false);
    }
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
      await clientApi.rescheduleMyBooking(editModal.booking._id, {
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

  const isEditableOrViewable = (booking) => {
    return booking.status !== "COMPLETED";
  };

  const handleDisputeSubmit = async () => {
    if (!disputeModal.booking) return;
    try {
      setSubmitting(true);
      await clientApi.raiseDispute(disputeModal.booking._id, {
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

  const handleReviewSubmit = async () => {
    if (!reviewModal.booking) return;
    
    try {
      setSubmitting(true);
      await clientApi.createReview({
        bookingId: reviewModal.booking._id,
        rating: reviewData.rating,
        comment: reviewData.comment,
      });
      setReviewModal({ open: false, booking: null });
      setReviewData({ rating: 5, comment: "" });
      setRefreshKey((k) => k + 1);
    } catch (error) {
      console.error("Failed to submit review:", error);
      alert(error.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const filterOptions = [
    { value: "", label: "All Bookings" },
    { value: "BOOKED", label: "Upcoming" },
    { value: "ACTIVE", label: "Active" },
    { value: "COMPLETED", label: "Completed" },
    { value: "CANCELLED", label: "Cancelled" },
  ];

  const columns = [
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
      key: "consultationType",
      label: "Type",
      render: (value) => value || "CHAT",
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
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface/50 px-3 py-1.5 text-left transition-colors hover:bg-surface hover:border-primary/30 cursor-pointer"
            >
              <Badge variant={row.dispute.status === "RESOLVED" ? "success" : "info"} size="sm">
                {row.dispute.status.replace(/_/g, " ")}
              </Badge>
              <span className="text-xs text-text-secondary">View details</span>
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
        ),
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      className: "whitespace-nowrap",
      render: (_, row) => (
        <ActionMenu>
          {isEditableOrViewable(row) && (
            <IconButton
              icon={FiEye}
              label="View booking"
              variant="secondary"
              outline
              onClick={() => setViewModal({ open: true, booking: row })}
            />
          )}
          {isEditableOrViewable(row) && row.status === "BOOKED" && (
            <IconButton
              icon={FiEdit2}
              label="Edit booking"
              variant="secondary"
              outline
              onClick={() => handleOpenEdit(row)}
            />
          )}
          {row.status === "ACTIVE" && (
            <Button
              size="xs"
              variant="primary"
              icon={FiMessageCircle}
              onClick={() => navigate(`/chat/${row._id}`)}
            >
              Chat
            </Button>
          )}
          {row.status === "COMPLETED" && !row.hasReview && (
            <Button
              size="xs"
              variant="secondary"
              outline
              icon={FiStar}
              onClick={() => setReviewModal({ open: true, booking: row })}
            >
              Review
            </Button>
          )}
          <IconButton
            icon={FiTrash2}
            label="Delete booking"
            variant="danger"
            outline
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
              <strong>Lawyer:</strong> {viewModal.booking.lawyerUserId?.email || "N/A"}
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
            containerClassName="mb-0"
          />
          <Input
            label="Time"
            type="time"
            step="900"
            value={editData.time}
            onChange={(e) => setEditData((p) => ({ ...p, time: e.target.value }))}
            containerClassName="mb-0"
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
          containerClassName="mt-4"
        />
        <p className="mt-2 mb-0 text-text-muted text-xs">
          Tip: Editing is allowed only for upcoming bookings. The new time must fit the lawyer availability.
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
          This will remove the booking from your history. You can delete completed bookings too.
        </p>
      </Modal>

      <Modal
        isOpen={reviewModal.open}
        onClose={() => setReviewModal({ open: false, booking: null })}
        title="Leave a Review"
        footer={
          <>
            <Button variant="secondary" onClick={() => setReviewModal({ open: false, booking: null })}>
              Cancel
            </Button>
            <Button onClick={handleReviewSubmit} loading={submitting}>
              Submit Review
            </Button>
          </>
        }
      >
        <div className="mb-4">
          <label className="block mb-2 text-text-secondary">
            Rating
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setReviewData({ ...reviewData, rating: star })}
                className={`bg-transparent border-none text-2xl cursor-pointer ${
                  star <= reviewData.rating ? "text-warning" : "text-text-muted"
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </div>
        <Textarea
          label="Comment (optional)"
          placeholder="Share your experience..."
          value={reviewData.comment}
          onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
        />
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
                  <p className="m-0 text-success"><strong>Refund Amount:</strong> ${disputeViewModal.booking.dispute.refundAmount} credited to your wallet</p>
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
