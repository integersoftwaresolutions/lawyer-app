import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { lawyerApi } from "../../services/lawyer.api";
import { bookingApi } from "../../services/booking.api";
import { useAuth } from "../../hooks/useAuth";
import { Navbar } from "../../components/layout";
import { Modal, Button, Input, Select } from "../../components/ui";

export default function LawyerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
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
      <div className="min-h-screen bg-background text-text-primary flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-[3px] border-border border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!lawyer) {
    return (
      <div className="min-h-screen bg-background text-text-primary flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">👤</div>
          <h3 className="text-xl font-bold mb-2 text-text-primary">
            Lawyer not found
          </h3>
          <p className="text-text-secondary">This lawyer profile doesn't exist</p>
        </div>
      </div>
    );
  }

  const isClient = user?.role === "CLIENT";

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background text-text-primary p-6 max-w-[800px] mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="py-3 px-6 rounded border border-border bg-secondary text-secondary-text cursor-pointer mb-6 inline-flex items-center gap-2 hover:bg-secondary-hover transition-colors"
        >
          ← Back to Search
        </button>

        <div className="border border-border rounded-lg bg-card p-8 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-text-primary">{lawyer.fullName || "Lawyer"}</h1>
              <div className="flex items-center gap-2 mb-4">
                <span>★</span>
                <span>{lawyer.ratingAvg ? lawyer.ratingAvg.toFixed(1) : "0.0"}</span>
                {lawyer.ratingCount && <span>({lawyer.ratingCount} reviews)</span>}
                <span
                  className={`py-1 px-3 rounded-full text-xs font-medium ${
                    lawyer.verificationStatus === "APPROVED"
                      ? "bg-success text-success-text"
                      : "bg-warning text-warning-text"
                  }`}
                >
                  {lawyer.verificationStatus}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-text-primary">${lawyer.hourlyRate}</div>
              <div className="text-sm text-text-secondary">per hour</div>
            </div>
          </div>

          {lawyer.bio && (
            <div>
              <h3 className="text-lg font-bold mb-3 text-text-primary">About</h3>
              <p className="text-base leading-relaxed text-text-secondary mb-6">{lawyer.bio}</p>
            </div>
          )}

          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-6">
            <div className="p-4 border border-border rounded bg-surface">
              <div className="text-xs text-text-secondary mb-1">Location</div>
              <div className="text-base font-medium text-text-primary">📍 {lawyer.city || "Not specified"}</div>
            </div>
            <div className="p-4 border border-border rounded bg-surface">
              <div className="text-xs text-text-secondary mb-1">Experience</div>
              <div className="text-base font-medium text-text-primary">💼 {lawyer.experienceYears} years</div>
            </div>
            <div className="p-4 border border-border rounded bg-surface">
              <div className="text-xs text-text-secondary mb-1">Specialization</div>
              <div className="text-base font-medium text-text-primary">
                ⚖️{" "}
                {lawyer.specialization && lawyer.specialization.length > 0
                  ? lawyer.specialization.join(", ")
                  : "General practice"}
              </div>
            </div>
          </div>
        </div>

        {isClient && (
          <div className="border border-border rounded-lg bg-card p-6 mb-6">
            <h3 className="text-lg font-bold mb-4 text-text-primary">Book a Consultation</h3>
            <div>
              <button
                className="py-3 px-6 rounded bg-primary text-primary-text cursor-pointer font-medium mr-3 hover:bg-primary-hover transition-colors"
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
              <button className="py-3 px-6 rounded border border-border bg-secondary text-secondary-text cursor-pointer font-medium hover:bg-secondary-hover transition-colors">
                Send Message
              </button>
            </div>
          </div>
        )}

        {isClient && (
          <div className="border border-border rounded-lg bg-card p-6 mb-6">
            <h3 className="text-lg font-bold mb-4 text-text-primary">Availability</h3>
            <div className="flex gap-3 items-end flex-wrap">
              <div className="min-w-[220px]">
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
            <div className="mt-3">
              {slotsLoading ? (
                <p className="text-text-secondary m-0">Loading slots...</p>
              ) : availableSlots.length === 0 ? (
                <p className="text-text-secondary m-0">
                  {availabilityDate
                    ? "No slots available for this date."
                    : "Select a date to see available slots."}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableSlots.map((s) => (
                    <span
                      key={`${s.start}-${s.end}`}
                      className="py-1.5 px-2.5 rounded-full border border-border bg-surface text-text-primary text-xs"
                    >
                      {s.start} - {s.end}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="border border-border rounded-lg bg-card p-6">
          <h3 className="text-lg font-bold mb-4 text-text-primary">Client Reviews</h3>
          {lawyer.ratingCount > 0 ? (
            <div className="text-center py-8 text-text-secondary">
              <div className="text-4xl mb-2">⭐</div>
              <p>Reviews coming soon</p>
            </div>
          ) : (
            <div className="text-center py-8 text-text-secondary">
              <div className="text-4xl mb-2">💬</div>
              <p>No reviews yet</p>
              <p className="text-sm">Be the first to review this lawyer</p>
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
          <div className="text-text-secondary text-xs">
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
          <div className="-mt-1.5 mb-4 text-text-secondary text-xs">
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
        <div className="mt-4 p-3 bg-surface rounded-md">
          <p className="text-text-secondary m-0 text-sm">
            <strong>Estimated Cost:</strong> ${Math.round((lawyer?.hourlyRate || 0) * bookingData.durationMinutes / 60)}
          </p>
        </div>
      </Modal>
      </div>
    </>
  );
}
