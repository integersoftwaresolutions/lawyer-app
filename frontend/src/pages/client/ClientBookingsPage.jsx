import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { clientApi } from "../../services/client.api";
import { Card, Button, Badge, Modal, Textarea, Input, Select } from "../../components/ui";

export default function ClientBookingsPage() {
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

        {loading ? (
          <p className="text-text-secondary">Loading...</p>
        ) : bookings.length === 0 ? (
          <div className="text-center py-10 text-text-secondary">
            <p>No bookings found</p>
            <Button className="mt-4" onClick={() => navigate("/client/search")}>
              Find Lawyers
            </Button>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-3 border-b border-border text-text-secondary text-xs font-semibold">Lawyer</th>
                <th className="text-left p-3 border-b border-border text-text-secondary text-xs font-semibold">Date & Time</th>
                <th className="text-left p-3 border-b border-border text-text-secondary text-xs font-semibold">Duration</th>
                <th className="text-left p-3 border-b border-border text-text-secondary text-xs font-semibold">Type</th>
                <th className="text-left p-3 border-b border-border text-text-secondary text-xs font-semibold">Status</th>
                <th className="text-left p-3 border-b border-border text-text-secondary text-xs font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking._id}>
                  <td className="p-3 border-b border-border text-text-primary text-sm">{booking.lawyerUserId?.email || "N/A"}</td>
                  <td className="p-3 border-b border-border text-text-primary text-sm">{formatDate(booking.startAt)}</td>
                  <td className="p-3 border-b border-border text-text-primary text-sm">{booking.durationMinutes} min</td>
                  <td className="p-3 border-b border-border text-text-primary text-sm">{booking.consultationType || "CHAT"}</td>
                  <td className="p-3 border-b border-border text-text-primary text-sm">{getStatusBadge(booking.status)}</td>
                  <td className="p-3 border-b border-border text-text-primary text-sm">
                    <div className="flex gap-2 flex-wrap">
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
    </div>
  );
}
