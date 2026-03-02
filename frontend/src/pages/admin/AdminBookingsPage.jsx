import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { adminApi } from "../../services/admin.api";
import { Card, Button, Badge } from "../../components/ui";

export default function AdminBookingsPage() {
  const { colors } = useTheme();
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
            All Bookings
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
          </div>
        ) : (
          <table style={tableStyles}>
            <thead>
              <tr>
                <th style={thStyles}>Client</th>
                <th style={thStyles}>Lawyer</th>
                <th style={thStyles}>Date & Time</th>
                <th style={thStyles}>Duration</th>
                <th style={thStyles}>Amount</th>
                <th style={thStyles}>Platform Fee</th>
                <th style={thStyles}>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking._id}>
                  <td style={tdStyles}>{booking.clientId?.email || "N/A"}</td>
                  <td style={tdStyles}>{booking.lawyerUserId?.email || "N/A"}</td>
                  <td style={tdStyles}>{formatDate(booking.startAt)}</td>
                  <td style={tdStyles}>{booking.durationMinutes} min</td>
                  <td style={tdStyles}>${booking.amount || 0}</td>
                  <td style={tdStyles}>${booking.platformFee || 0}</td>
                  <td style={tdStyles}>{getStatusBadge(booking.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
