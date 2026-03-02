import { useState, useEffect } from "react";
import { adminApi } from "../../services/admin.api";
import { Card, Button, Badge } from "../../components/ui";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    loadBookings();
  }, [filter]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const params = filter ? { status: filter } : {};
      const res = await adminApi.getBookings(params);
      setBookings(res.data || []);
    } catch (error) {
      console.error("Failed to load bookings:", error);
    } finally {
      setLoading(false);
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
    { value: "BOOKED", label: "Booked" },
    { value: "ACTIVE", label: "Active" },
    { value: "COMPLETED", label: "Completed" },
    { value: "CANCELLED", label: "Cancelled" },
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

        {loading ? (
          <p className="text-text-secondary">Loading...</p>
        ) : bookings.length === 0 ? (
          <div className="text-center py-10 text-text-secondary">
            <p>No bookings found</p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-3 border-b border-border text-text-secondary text-xs font-semibold">Client</th>
                <th className="text-left p-3 border-b border-border text-text-secondary text-xs font-semibold">Lawyer</th>
                <th className="text-left p-3 border-b border-border text-text-secondary text-xs font-semibold">Date & Time</th>
                <th className="text-left p-3 border-b border-border text-text-secondary text-xs font-semibold">Duration</th>
                <th className="text-left p-3 border-b border-border text-text-secondary text-xs font-semibold">Amount</th>
                <th className="text-left p-3 border-b border-border text-text-secondary text-xs font-semibold">Platform Fee</th>
                <th className="text-left p-3 border-b border-border text-text-secondary text-xs font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking._id}>
                  <td className="p-3 border-b border-border text-text-primary text-sm">{booking.clientId?.email || "N/A"}</td>
                  <td className="p-3 border-b border-border text-text-primary text-sm">{booking.lawyerUserId?.email || "N/A"}</td>
                  <td className="p-3 border-b border-border text-text-primary text-sm">{formatDate(booking.startAt)}</td>
                  <td className="p-3 border-b border-border text-text-primary text-sm">{booking.durationMinutes} min</td>
                  <td className="p-3 border-b border-border text-text-primary text-sm">${booking.amount || 0}</td>
                  <td className="p-3 border-b border-border text-text-primary text-sm">${booking.platformFee || 0}</td>
                  <td className="p-3 border-b border-border text-text-primary text-sm">{getStatusBadge(booking.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
