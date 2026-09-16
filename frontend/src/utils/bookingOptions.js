/**
 * Shared helpers for lawyer booking dropdowns (case create / link).
 */

export function bookingOptionId(booking) {
  return String(booking?.id || booking?._id || "");
}

export function formatBookingOptionLabel(booking) {
  if (!booking) return "";
  const id = bookingOptionId(booking);
  const client =
    booking.clientId?.fullName ||
    booking.clientId?.name ||
    booking.clientId?.email ||
    "Client";
  let when = "";
  try {
    if (booking.startAt) {
      when = new Date(booking.startAt).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short"
      });
    }
  } catch {
    when = "";
  }
  const status = (booking.status || "").replace(/_/g, " ");
  const parts = [client, when, status].filter(Boolean);
  const shortId = id ? id.slice(-6) : "";
  return parts.length ? `${parts.join(" · ")}${shortId ? ` (#${shortId})` : ""}` : id;
}

export function bookingsToSelectOptions(bookings = []) {
  return bookings
    .map((b) => {
      const value = bookingOptionId(b);
      if (!value) return null;
      return { value, label: formatBookingOptionLabel(b) };
    })
    .filter(Boolean);
}
