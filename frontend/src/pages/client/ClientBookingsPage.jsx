import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { clientApi } from "../../services/client.api";
import { Card, Button, Badge, Modal, Textarea } from "../../components/ui";

export default function ClientBookingsPage() {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [reviewModal, setReviewModal] = useState({ open: false, booking: null });
  const [reviewData, setReviewData] = useState({ rating: 5, comment: "" });
  const [submitting, setSubmitting] = useState(false);
  const [viewModal, setViewModal] = useState({ open: false, booking: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, booking: null });
  const [editModal, setEditModal] = useState({ open: false, booking: null });
  const [editData, setEditData] = useState({ date: "", time: "", durationMinutes: 30 });

  useEffect(() => {
    loadBookings();
  }, [filter]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const params = filter ? { status: filter } : {};
      const res = await clientApi.getMyBookings(params);
      setBookings(res.data || []);
    } catch (error) {
      console.error("Failed to load bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.booking) return;
    try {
      setSubmitting(true);
      await clientApi.deleteMyBooking(deleteModal.booking._id);
      setDeleteModal({ open: false, booking: null });
      loadBookings();
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
      loadBookings();
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
      loadBookings();
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

  const tableStyles = {
    width: "100%",
    borderCollapse: "collapse",
  };

  const thStyles = {
    textAlign: "left",
    padding: "12px",
    borderBottom: `1px solid ${colors.border}`,
    color: colors.text.secondary,
    fontSize: "13px",
    fontWeight: "600",
  };

  const tdStyles = {
    padding: "12px",
    borderBottom: `1px solid ${colors.border}`,
    color: colors.text.primary,
    fontSize: "14px",
  };

  return (
    <div>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "bold", color: colors.text.primary, margin: 0 }}>
            My Bookings
          </h2>
          <div style={{ display: "flex", gap: "8px" }}>
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

        {loading ? (
          <p style={{ color: colors.text.secondary }}>Loading...</p>
        ) : bookings.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: colors.text.secondary }}>
            <p>No bookings found</p>
            <Button style={{ marginTop: "16px" }} onClick={() => navigate("/client/search")}>
              Find Lawyers
            </Button>
          </div>
        ) : (
          <table style={tableStyles}>
            <thead>
              <tr>
                <th style={thStyles}>Lawyer</th>
                <th style={thStyles}>Date & Time</th>
                <th style={thStyles}>Duration</th>
                <th style={thStyles}>Type</th>
                <th style={thStyles}>Status</th>
                <th style={thStyles}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking._id}>
                  <td style={tdStyles}>{booking.lawyerUserId?.email || "N/A"}</td>
                  <td style={tdStyles}>{formatDate(booking.startAt)}</td>
                  <td style={tdStyles}>{booking.durationMinutes} min</td>
                  <td style={tdStyles}>{booking.consultationType || "CHAT"}</td>
                  <td style={tdStyles}>{getStatusBadge(booking.status)}</td>
                  <td style={tdStyles}>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {isEditableOrViewable(booking) && (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setViewModal({ open: true, booking })}
                          >
                            View
                          </Button>
                          {booking.status === "BOOKED" && (
                            <Button size="sm" variant="secondary" onClick={() => handleOpenEdit(booking)}>
                              Edit
                            </Button>
                          )}
                        </>
                      )}

                      {booking.status === "ACTIVE" && (
                        <Button size="sm" onClick={() => navigate(`/chat/${booking._id}`)}>
                          Join Chat
                        </Button>
                      )}

                      {booking.status === "COMPLETED" && !booking.hasReview && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setReviewModal({ open: true, booking })}
                        >
                          Review
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setDeleteModal({ open: true, booking })}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
          <div style={{ color: colors.text.primary }}>
            <div style={{ marginBottom: "10px" }}>
              <strong>Lawyer:</strong> {viewModal.booking.lawyerUserId?.email || "N/A"}
            </div>
            <div style={{ marginBottom: "10px" }}>
              <strong>Date & Time:</strong> {formatDate(viewModal.booking.startAt)}
            </div>
            <div style={{ marginBottom: "10px" }}>
              <strong>Duration:</strong> {viewModal.booking.durationMinutes} minutes
            </div>
            <div style={{ marginBottom: "10px" }}>
              <strong>Type:</strong> {viewModal.booking.consultationType || "CHAT"}
            </div>
            <div style={{ marginBottom: "10px" }}>
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "8px", color: colors.text.secondary, fontSize: "14px", fontWeight: 500 }}>
              Date
            </label>
            <input
              type="date"
              value={editData.date}
              onChange={(e) => setEditData((p) => ({ ...p, date: e.target.value }))}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "6px",
                border: `1px solid ${colors.input.border}`,
                backgroundColor: colors.input.background,
                color: colors.input.text
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "8px", color: colors.text.secondary, fontSize: "14px", fontWeight: 500 }}>
              Time
            </label>
            <input
              type="time"
              step="900"
              value={editData.time}
              onChange={(e) => setEditData((p) => ({ ...p, time: e.target.value }))}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "6px",
                border: `1px solid ${colors.input.border}`,
                backgroundColor: colors.input.background,
                color: colors.input.text
              }}
            />
          </div>
        </div>

        <div style={{ marginTop: "16px" }}>
          <label style={{ display: "block", marginBottom: "8px", color: colors.text.secondary, fontSize: "14px", fontWeight: 500 }}>
            Duration
          </label>
          <select
            value={editData.durationMinutes}
            onChange={(e) => setEditData((p) => ({ ...p, durationMinutes: parseInt(e.target.value) }))}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: "6px",
              border: `1px solid ${colors.input.border}`,
              backgroundColor: colors.input.background,
              color: colors.input.text
            }}
          >
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>60 minutes</option>
            <option value={90}>90 minutes</option>
            <option value={120}>120 minutes</option>
          </select>
          <p style={{ marginTop: "8px", marginBottom: 0, color: colors.text.muted, fontSize: "13px" }}>
            Tip: Editing is allowed only for upcoming bookings. The new time must fit the lawyer availability.
          </p>
        </div>
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
        <p style={{ color: colors.text.secondary, marginTop: 0 }}>
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
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "8px", color: colors.text.secondary }}>
            Rating
          </label>
          <div style={{ display: "flex", gap: "8px" }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setReviewData({ ...reviewData, rating: star })}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: star <= reviewData.rating ? "#ffc107" : colors.text.muted,
                }}
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
    </div>
  );
}
