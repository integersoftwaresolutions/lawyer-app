import { useCallback, useEffect, useState } from "react";
import { lawyerApi } from "../services/lawyer.api";
import { bookingsToSelectOptions } from "../utils/bookingOptions";

/**
 * Loads lawyer bookings for Select dropdowns (case create / booking link).
 */
export function useLawyerBookingOptions({ enabled = true, limit = 50 } = {}) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!enabled) {
      setOptions([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await lawyerApi.getMyBookings({ page: 1, limit });
      setOptions(bookingsToSelectOptions(res.items || []));
    } catch (err) {
      setOptions([]);
      setError(err?.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [enabled, limit]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { options, loading, error, reload };
}
