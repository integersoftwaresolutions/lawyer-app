import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { lawyerApi } from "../../services/lawyer.api";
import { bookingApi } from "../../services/booking.api";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../context/ThemeContext";
import { Navbar } from "../../components/layout";
import { Modal, Button, Input, Select } from "../../components/ui";

export default function LawyerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [lawyer, setLawyer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingModal, setBookingModal] = useState(false);
  const [availabilityDate, setAvailabilityDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingData, setBookingData] = useState({
    slot: "",
    startTime: "",
    durationMinutes: 30,
    consultationType: "CHAT",
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const slotOptions = useMemo(() => {
    return (availableSlots || []).map((s) => ({
      value: `${s.start}-${s.end}`,
      label: `${s.start} - ${s.end}`
    }));
  }, [availableSlots]);

  const parseTimeToMinutes = (hhmm) => {
    if (!hhmm || !hhmm.includes(":")) return null;
    const [h, m] = hhmm.split(":");
    const hh = Number(h);
    const mm = Number(m);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
    return hh * 60 + mm;
  };

  const minutesToTime = (mins) => {
    const m = ((mins % 1440) + 1440) % 1440;
    const hh = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    return `${hh}:${mm}`;
  };

  const timeOptions = useMemo(() => {
    if (!availabilityDate || !bookingData.slot) return [];
    const [slotStart, slotEnd] = bookingData.slot.split("-");
    const startM = parseTimeToMinutes(slotStart);
    const endM = parseTimeToMinutes(slotEnd);
    if (startM === null || endM === null) return [];

    const duration = Number(bookingData.durationMinutes) || 30;
    const latestStart = endM - duration;
    if (latestStart < startM) return [];

    const nowDt = new Date();
    const yyyy = nowDt.getFullYear();
    const mm = String(nowDt.getMonth() + 1).padStart(2, "0");
    const dd = String(nowDt.getDate()).padStart(2, "0");
    const todayIso = `${yyyy}-${mm}-${dd}`;
    const isToday = availabilityDate === todayIso;

    let minStartM = startM;
    if (isToday) {
      const currentM = nowDt.getHours() * 60 + nowDt.getMinutes();
      const step = 15;
      const rounded = Math.ceil((currentM + 1) / step) * step;
      minStartM = Math.max(startM, rounded);
    }

    const step = 15;
    const out = [];
    for (let t = startM; t <= latestStart; t += step) {
      if (t < minStartM) continue;
      out.push({ value: minutesToTime(t), label: minutesToTime(t) });
    }
    return out;
  }, [availabilityDate, bookingData.slot, bookingData.durationMinutes]);

  const selectedSessionRange = useMemo(() => {
    if (!bookingData.startTime) return null;
    const startM = parseTimeToMinutes(bookingData.startTime);
    if (startM === null) return null;
    const endM = startM + (Number(bookingData.durationMinutes) || 30);
    return `${bookingData.startTime} - ${minutesToTime(endM)}`;
  }, [bookingData.startTime, bookingData.durationMinutes]);

  const loadSlots = async () => {
    if (!availabilityDate) return;
    try {
      setSlotsLoading(true);
      const res = await lawyerApi.getAvailableSlots(id, availabilityDate);
      setAvailableSlots(res.data || []);
    } catch (error) {
      console.error("Failed to load slots:", error);
      alert(error.response?.data?.message || "Failed to load available slots");
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!availabilityDate || !bookingData.slot || !bookingData.startTime) {
      alert("Please select a date, a slot, and a session start time");
      return;
    }

    const startAtIso = new Date(`${availabilityDate}T${bookingData.startTime}:00`).toISOString();

    try {
      setSubmitting(true);
      await bookingApi.create({
        lawyerUserId: id,
        startAt: startAtIso,
        durationMinutes: bookingData.durationMinutes,
        consultationType: bookingData.consultationType,
        notes: bookingData.notes
      });
      setBookingModal(false);
      alert("Booking created successfully!");
      navigate("/client/bookings");
    } catch (error) {
      console.error("Failed to create booking:", error);
      alert(error.response?.data?.message || "Failed to create booking");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await lawyerApi.profile(id);
        setLawyer(res.data);
      } catch (error) {
        console.error("Failed to load lawyer profile:", error);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [id]);

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh',
        backgroundColor: colors.background,
        color: colors.text.primary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid ' + colors.border,
            borderTop: '3px solid ' + colors.button.primary,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: colors.text.secondary }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!lawyer) {
    return (
      <div style={{ 
        minHeight: '100vh',
        backgroundColor: colors.background,
        color: colors.text.primary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>👤</div>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: colors.text.primary }}>
            Lawyer not found
          </h3>
          <p style={{ color: colors.text.secondary }}>This lawyer profile doesn't exist</p>
        </div>
      </div>
    );
  }

  const isClient = user?.role === "CLIENT";

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: colors.background,
      color: colors.text.primary,
      padding: '24px',
      maxWidth: '800px',
      margin: '0 auto'
    },
    backButton: {
      padding: '12px 24px',
      borderRadius: '4px',
      border: `1px solid ${colors.border}`,
      backgroundColor: colors.button.secondary,
      color: colors.button.secondaryText,
      cursor: 'pointer',
      marginBottom: '24px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px'
    },
    profileCard: {
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      backgroundColor: colors.card,
      padding: '32px',
      marginBottom: '24px'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '24px'
    },
    name: {
      fontSize: '32px',
      fontWeight: 'bold',
      marginBottom: '8px',
      color: colors.text.primary
    },
    rating: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '16px'
    },
    rate: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: colors.text.primary
    },
    infoGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginBottom: '24px'
    },
    infoItem: {
      padding: '16px',
      border: `1px solid ${colors.border}`,
      borderRadius: '4px',
      backgroundColor: colors.surface
    },
    infoLabel: {
      fontSize: '12px',
      color: colors.text.secondary,
      marginBottom: '4px'
    },
    infoValue: {
      fontSize: '16px',
      fontWeight: '500',
      color: colors.text.primary
    },
    bio: {
      fontSize: '16px',
      lineHeight: '1.6',
      color: colors.text.secondary,
      marginBottom: '24px'
    },
    actionCard: {
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      backgroundColor: colors.card,
      padding: '24px',
      marginBottom: '24px'
    },
    button: {
      padding: '12px 24px',
      borderRadius: '4px',
      border: 'none',
      backgroundColor: colors.button.primary,
      color: colors.button.primaryText,
      cursor: 'pointer',
      fontWeight: '500',
      marginRight: '12px'
    },
    secondaryButton: {
      padding: '12px 24px',
      borderRadius: '4px',
      border: `1px solid ${colors.border}`,
      backgroundColor: colors.button.secondary,
      color: colors.button.secondaryText,
      cursor: 'pointer',
      fontWeight: '500'
    },
    reviewsCard: {
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      backgroundColor: colors.card,
      padding: '24px'
    },
    availabilityCard: {
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      backgroundColor: colors.card,
      padding: '24px',
      marginBottom: '24px'
    }
  };

  return (
    <>
      <Navbar />
      <div style={styles.container}>
      <button
        onClick={() => navigate(-1)}
        style={styles.backButton}
      >
        ← Back to Search
      </button>

      <div style={styles.profileCard}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.name}>{lawyer.fullName || "Lawyer"}</h1>
            <div style={styles.rating}>
              <span>★</span>
              <span>{lawyer.ratingAvg ? lawyer.ratingAvg.toFixed(1) : "0.0"}</span>
              {lawyer.ratingCount && <span>({lawyer.ratingCount} reviews)</span>}
              <span style={{
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '500',
                backgroundColor: lawyer.verificationStatus === "APPROVED" ? '#28a745' : '#ffc107',
                color: lawyer.verificationStatus === "APPROVED" ? 'white' : 'black'
              }}>
                {lawyer.verificationStatus}
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={styles.rate}>${lawyer.hourlyRate}</div>
            <div style={{ fontSize: '14px', color: colors.text.secondary }}>per hour</div>
          </div>
        </div>

        {lawyer.bio && (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px', color: colors.text.primary }}>About</h3>
            <p style={styles.bio}>{lawyer.bio}</p>
          </div>
        )}

        <div style={styles.infoGrid}>
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>Location</div>
            <div style={styles.infoValue}>📍 {lawyer.city || "Not specified"}</div>
          </div>
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>Experience</div>
            <div style={styles.infoValue}>💼 {lawyer.experienceYears} years</div>
          </div>
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>Specialization</div>
            <div style={styles.infoValue}>
              ⚖️ {lawyer.specialization && lawyer.specialization.length > 0 
                ? lawyer.specialization.join(", ") 
                : "General practice"}
            </div>
          </div>
        </div>
      </div>

      {isClient && (
        <div style={styles.actionCard}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: colors.text.primary }}>
            Book a Consultation
          </h3>
          <div>
            <button
              style={styles.button}
              onClick={() => {
                const today = new Date();
                const yyyy = today.getFullYear();
                const mm = String(today.getMonth() + 1).padStart(2, "0");
                const dd = String(today.getDate()).padStart(2, "0");
                const isoDate = `${yyyy}-${mm}-${dd}`;
                setAvailabilityDate((prev) => prev || isoDate);
                setBookingModal(true);
              }}
            >
              Book Now
            </button>
            <button style={styles.secondaryButton}>Send Message</button>
          </div>
        </div>
      )}

      {isClient && (
        <div style={styles.availabilityCard}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: colors.text.primary }}>
            Availability
          </h3>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ minWidth: 220 }}>
              <Input
                label="Select Date"
                type="date"
                value={availabilityDate}
                onChange={(e) => setAvailabilityDate(e.target.value)}
              />
            </div>
            <Button
              variant="secondary"
              loading={slotsLoading}
              onClick={loadSlots}
              disabled={!availabilityDate}
            >
              Load Slots
            </Button>
          </div>
          <div style={{ marginTop: "12px" }}>
            {slotsLoading ? (
              <p style={{ color: colors.text.secondary, margin: 0 }}>Loading slots...</p>
            ) : availableSlots.length === 0 ? (
              <p style={{ color: colors.text.secondary, margin: 0 }}>
                {availabilityDate ? "No slots available for this date." : "Select a date to see available slots."}
              </p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {availableSlots.map((s) => (
                  <span
                    key={`${s.start}-${s.end}`}
                    style={{
                      padding: "6px 10px",
                      borderRadius: "999px",
                      border: `1px solid ${colors.border}`,
                      backgroundColor: colors.surface,
                      color: colors.text.primary,
                      fontSize: "13px"
                    }}
                  >
                    {s.start} - {s.end}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div style={styles.reviewsCard}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: colors.text.primary }}>
          Client Reviews
        </h3>
        {lawyer.ratingCount > 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: colors.text.secondary }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>⭐</div>
            <p>Reviews coming soon</p>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px', color: colors.text.secondary }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>💬</div>
            <p>No reviews yet</p>
            <p style={{ fontSize: '14px' }}>Be the first to review this lawyer</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={bookingModal}
        onClose={() => setBookingModal(false)}
        title={`Book Consultation with ${lawyer?.fullName}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setBookingModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleBooking} loading={submitting}>
              Confirm Booking
            </Button>
          </>
        }
      >
        <Input
          label="Date"
          type="date"
          value={availabilityDate}
          onChange={(e) => {
            setAvailabilityDate(e.target.value);
            setAvailableSlots([]);
            setBookingData((p) => ({ ...p, slot: "", startTime: "" }));
          }}
        />
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
          <Button
            variant="secondary"
            size="sm"
            loading={slotsLoading}
            onClick={loadSlots}
            disabled={!availabilityDate}
          >
            Load Slots
          </Button>
          <div style={{ color: colors.text.secondary, fontSize: "13px" }}>
            Select a slot to auto-fill booking time.
          </div>
        </div>
        <Select
          label="Available Slots"
          value={bookingData.slot}
          onChange={(e) => {
            const slot = e.target.value;
            const next = { ...bookingData, slot, startTime: "" };

            if (availabilityDate && slot) {
              const opts = (() => {
                const [slotStart, slotEnd] = slot.split("-");
                const startM = parseTimeToMinutes(slotStart);
                const endM = parseTimeToMinutes(slotEnd);
                const duration = Number(next.durationMinutes) || 30;
                const latestStart = endM - duration;
                if (startM === null || endM === null || latestStart < startM) return [];

                const nowDt = new Date();
                const yyyy = nowDt.getFullYear();
                const mm = String(nowDt.getMonth() + 1).padStart(2, "0");
                const dd = String(nowDt.getDate()).padStart(2, "0");
                const todayIso = `${yyyy}-${mm}-${dd}`;
                const isToday = availabilityDate === todayIso;

                let minStartM = startM;
                if (isToday) {
                  const currentM = nowDt.getHours() * 60 + nowDt.getMinutes();
                  const step = 15;
                  const rounded = Math.ceil((currentM + 1) / step) * step;
                  minStartM = Math.max(startM, rounded);
                }

                const step = 15;
                const out = [];
                for (let t = startM; t <= latestStart; t += step) {
                  if (t < minStartM) continue;
                  out.push(minutesToTime(t));
                }
                return out;
              })();

              if (opts.length) {
                next.startTime = opts[0];
              }
            }

            setBookingData(next);
          }}
          placeholder={availabilityDate ? "Select a slot" : "Select date first"}
          options={slotOptions.map((o) => ({ value: o.value, label: o.label }))}
        />

        <Select
          label="Session Start Time"
          value={bookingData.startTime}
          onChange={(e) => setBookingData({ ...bookingData, startTime: e.target.value })}
          placeholder={bookingData.slot ? "Select start time" : "Select slot first"}
          options={timeOptions}
        />

        {selectedSessionRange && (
          <div style={{ marginTop: "-6px", marginBottom: "16px", color: colors.text.secondary, fontSize: "13px" }}>
            Selected session: {selectedSessionRange}
          </div>
        )}
        <Select
          label="Duration"
          value={bookingData.durationMinutes}
          onChange={(e) => {
            const durationMinutes = parseInt(e.target.value);
            const next = { ...bookingData, durationMinutes };
            setBookingData(next);
          }}
          options={[
            { value: 15, label: "15 minutes" },
            { value: 30, label: "30 minutes" },
            { value: 45, label: "45 minutes" },
            { value: 60, label: "60 minutes" },
          ]}
        />
        <Select
          label="Consultation Type"
          value={bookingData.consultationType}
          onChange={(e) => setBookingData({ ...bookingData, consultationType: e.target.value })}
          options={[
            { value: "CHAT", label: "Chat Only" },
            { value: "VIDEO", label: "Video Call" },
            { value: "CHAT_VIDEO", label: "Chat + Video" },
          ]}
        />
        <div style={{ marginTop: "16px", padding: "12px", backgroundColor: colors.surface, borderRadius: "6px" }}>
          <p style={{ color: colors.text.secondary, margin: 0, fontSize: "14px" }}>
            <strong>Estimated Cost:</strong> ${Math.round((lawyer?.hourlyRate || 0) * bookingData.durationMinutes / 60)}
          </p>
        </div>
      </Modal>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      </div>
    </>
  );
}
