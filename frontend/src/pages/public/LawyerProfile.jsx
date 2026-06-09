import { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { lawyerApi } from "../../services/lawyer.api";
import { bookingApi } from "../../services/booking.api";
import { useAuth } from "../../hooks/useAuth";
import { Navbar } from "../../components/layout";
import { Modal, Button, Input, Select, StateHandler, Card, Badge, Avatar } from "../../components/ui";
import { useStateHandler } from "../../hooks/useStateHandler";
import { 
  FiArrowLeft, 
  FiStar, 
  FiMapPin, 
  FiBriefcase, 
  FiDollarSign,
  FiShield,
  FiClock,
  FiMessageCircle,
  FiCalendar,
  FiUser,
  FiCheckCircle,
  FiAlertCircle,
  FiPhone,
  FiMail,
  FiLock
} from "react-icons/fi";

export default function LawyerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
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
  const [contactDetails, setContactDetails] = useState(null); // null=loading, false=no access, object=has access

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

  const { loading, error, data, retry } = useStateHandler(
    async () => {
      const res = await lawyerApi.profile(id);
      return res.data;
    },
    { dependencies: [id] }
  );

  const lawyer = data;

  const isClient = user?.role === "CLIENT";

  useEffect(() => {
    if (!id || !isClient || !lawyer) {
      setContactDetails(isClient && lawyer ? false : null);
      return;
    }
    let cancelled = false;
    setContactDetails(null);
    lawyerApi
      .getContactDetails(id)
      .then((res) => {
        if (!cancelled && res?.data) setContactDetails(res.data);
        else if (!cancelled) setContactDetails(false);
      })
      .catch(() => {
        if (!cancelled) setContactDetails(false);
      });
    return () => { cancelled = true; };
  }, [id, isClient, lawyer]);

  return (
    <StateHandler loading={loading} error={error} retry={retry}>
      <>
        <Navbar />
        {!lawyer ? (
          <div className="min-h-screen bg-background text-text-primary flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center mx-auto mb-6">
                <FiUser className="w-10 h-10 text-text-secondary" />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-text-primary">
                Lawyer not found
              </h3>
              <p className="text-text-secondary mb-6">This lawyer profile doesn't exist</p>
              <Button
                onClick={() => navigate(-1)}
                variant="secondary"
                className="inline-flex items-center gap-2"
              >
                <FiArrowLeft className="w-4 h-4" />
                Back to Search
              </Button>
            </div>
          </div>
        ) : (
          <div className="min-h-screen bg-background text-text-primary">
            <div className="max-w-6xl mx-auto px-6 py-8">
              {/* Back Button */}
              <Button
                onClick={() => navigate(-1)}
                variant="ghost"
                className="mb-6 inline-flex items-center gap-2"
              >
                <FiArrowLeft className="w-4 h-4" />
                Back to Search
              </Button>

              {/* Profile Header Card */}
              <Card className="mb-6 overflow-hidden">
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-8 border-b border-border">
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    {/* Profile Image/Avatar */}
                    <Avatar
                      user={lawyer}
                      size="2xl"
                      showBorder={true}
                      className="border-4 border-card"
                    />

                    {/* Profile Info */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <h1 className="text-3xl md:text-4xl font-bold text-text-primary">
                          {lawyer?.fullName || "Lawyer"}
                        </h1>
                        {lawyer?.verificationStatus === "APPROVED" && (
                          <Badge variant="success" className="flex items-center gap-1">
                            <FiShield className="w-3 h-3" />
                            Verified
                          </Badge>
                        )}
                        {lawyer?.isFeatured && lawyer?.featuredUntil && (
                          <Badge variant="warning" className="flex items-center gap-1">
                            Featured
                            {user?.role === "LAWYER" && user?.id === id && (
                              <span className="text-xs">
                                {" "}
                                · {new Date(lawyer.featuredUntil).toLocaleDateString("en-US")}
                              </span>
                            )}
                          </Badge>
                        )}
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <FiStar
                              key={i}
                              className={`w-5 h-5 ${
                                i < Math.round(lawyer?.ratingAvg || 0)
                                  ? "text-warning fill-warning"
                                  : "text-text-muted"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-lg font-semibold text-text-primary">
                          {lawyer?.ratingAvg ? lawyer.ratingAvg.toFixed(1) : "0.0"}
                        </span>
                        {lawyer?.ratingCount > 0 && (
                          <span className="text-text-secondary">
                            ({lawyer.ratingCount} {lawyer.ratingCount === 1 ? "review" : "reviews"})
                          </span>
                        )}
                      </div>

                      {/* Quick Stats */}
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2 text-text-secondary">
                          <FiMapPin className="w-4 h-4" />
                          <span>{lawyer?.city || "Location not specified"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-text-secondary">
                          <FiBriefcase className="w-4 h-4" />
                          <span>{lawyer?.experienceYears || 0} years experience</span>
                        </div>
                        {lawyer?.specialization && lawyer.specialization.length > 0 && (
                          <div className="flex items-center gap-2 text-text-secondary">
                            <FiCheckCircle className="w-4 h-4" />
                            <span>{lawyer.specialization.length} {lawyer.specialization.length === 1 ? "specialization" : "specializations"}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pricing Card */}
                    <div className="bg-card border border-border rounded-xl p-6 text-center min-w-[180px]">
                      <div className="text-3xl font-bold text-text-primary mb-1">
                        ${lawyer?.hourlyRate || 0}
                      </div>
                      <div className="text-sm text-text-secondary mb-4">per hour</div>
                      {isClient && (
                        <Button
                          fullWidth
                          onClick={() => {
                            const today = new Date();
                            const yyyy = today.getFullYear();
                            const mm = String(today.getMonth() + 1).padStart(2, "0");
                            const dd = String(today.getDate()).padStart(2, "0");
                            const isoDate = `${yyyy}-${mm}-${dd}`;
                            setAvailabilityDate((prev) => prev || isoDate);
                            setBookingModal(true);
                          }}
                          className="flex items-center justify-center gap-2"
                        >
                          <FiCalendar className="w-4 h-4" />
                          Book Now
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bio Section */}
                {lawyer?.bio && (
                  <div className="p-8">
                    <h2 className="text-xl font-bold mb-4 text-text-primary flex items-center gap-2">
                      <FiUser className="w-5 h-5" />
                      About
                    </h2>
                    <p className="text-base leading-relaxed text-text-secondary whitespace-pre-line">
                      {lawyer.bio}
                    </p>
                  </div>
                )}
              </Card>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <FiMapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-text-secondary mb-1">Location</div>
                      <div className="text-base font-semibold text-text-primary">
                        {lawyer?.city || "Not specified"}
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <FiBriefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-text-secondary mb-1">Experience</div>
                      <div className="text-base font-semibold text-text-primary">
                        {lawyer?.experienceYears || 0} years
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <FiDollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-text-secondary mb-1">Hourly Rate</div>
                      <div className="text-base font-semibold text-text-primary">
                        ${lawyer?.hourlyRate || 0}/hr
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Full-width Contact Section (clients only) */}
              {isClient && (
                <Card className={`mb-6 overflow-hidden ${!(contactDetails && (contactDetails.phone || contactDetails.email || contactDetails.whatsapp)) ? "border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent" : "border-l-4 border-l-primary"}`}>
                  <div className="p-6 md:p-8">
                    <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
                      <div className={`flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center ${
                        contactDetails && (contactDetails.phone || contactDetails.email || contactDetails.whatsapp)
                          ? "bg-success/15 text-success"
                          : "bg-primary/15 text-primary"
                      }`}>
                        {contactDetails && (contactDetails.phone || contactDetails.email || contactDetails.whatsapp) ? (
                          <FiPhone className="w-8 h-8" />
                        ) : (
                          <FiLock className="w-8 h-8" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-text-primary mb-1 flex items-center gap-2">
                          Contact {lawyer?.fullName}
                          {contactDetails && (contactDetails.phone || contactDetails.email || contactDetails.whatsapp) && (
                            <Badge variant="success" size="sm">Unlocked</Badge>
                          )}
                        </h2>
                        {contactDetails === null ? (
                          <div className="flex items-center gap-3 text-text-muted py-2">
                            <span className="inline-block w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <span>Checking access...</span>
                          </div>
                        ) : contactDetails && (contactDetails.phone || contactDetails.email || contactDetails.whatsapp) ? (
                          <div className="flex flex-wrap gap-x-8 gap-y-4 mt-4">
                            {contactDetails.phone && (
                              <a href={`tel:${contactDetails.phone}`} className="inline-flex items-center gap-3 px-4 py-3 rounded-xl bg-surface hover:bg-surface-hover border border-border transition-colors group">
                                <FiPhone className="w-5 h-5 text-primary group-hover:text-primary" />
                                <span className="font-medium text-text-primary">{contactDetails.phone}</span>
                              </a>
                            )}
                            {contactDetails.whatsapp && (
                              <a href={`https://wa.me/${contactDetails.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 px-4 py-3 rounded-xl bg-surface hover:bg-surface-hover border border-border transition-colors group">
                                <FiMessageCircle className="w-5 h-5 text-primary group-hover:text-primary" />
                                <span className="font-medium text-text-primary">{contactDetails.whatsapp}</span>
                              </a>
                            )}
                            {contactDetails.email && (
                              <a href={`mailto:${contactDetails.email}`} className="inline-flex items-center gap-3 px-4 py-3 rounded-xl bg-surface hover:bg-surface-hover border border-border transition-colors group break-all">
                                <FiMail className="w-5 h-5 text-primary group-hover:text-primary flex-shrink-0" />
                                <span className="font-medium text-text-primary">{contactDetails.email}</span>
                              </a>
                            )}
                          </div>
                        ) : (
                          <div className="mt-3 space-y-2">
                            <p className="text-text-secondary leading-relaxed m-0 max-w-xl">
                              Contact details are revealed after you complete a consultation with this lawyer. Book a session to get direct access to phone, WhatsApp, and email.
                            </p>
                            <Button
                              size="sm"
                              className="mt-3"
                              onClick={() => {
                                const today = new Date();
                                const yyyy = today.getFullYear();
                                const mm = String(today.getMonth() + 1).padStart(2, "0");
                                const dd = String(today.getDate()).padStart(2, "0");
                                setAvailabilityDate(`${yyyy}-${mm}-${dd}`);
                                setBookingModal(true);
                              }}
                            >
                              <FiCalendar className="w-4 h-4 mr-2" />
                              Book consultation to unlock
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Specializations */}
              {lawyer?.specialization && lawyer.specialization.length > 0 && (
                <Card className="mb-6">
                  <h2 className="text-xl font-bold mb-4 text-text-primary flex items-center gap-2">
                    <FiCheckCircle className="w-5 h-5" />
                    Specializations
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {lawyer.specialization.map((spec) => (
                      <Badge key={spec} variant="secondary" className="text-sm py-2 px-4">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}

              {/* Booking Section - Only for Clients */}
              {isClient && (
                <>
                  <Card className="mb-6">
                    <h2 className="text-xl font-bold mb-6 text-text-primary flex items-center gap-2">
                      <FiCalendar className="w-5 h-5" />
                      Book a Consultation
                    </h2>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        onClick={() => {
                          const today = new Date();
                          const yyyy = today.getFullYear();
                          const mm = String(today.getMonth() + 1).padStart(2, "0");
                          const dd = String(today.getDate()).padStart(2, "0");
                          const isoDate = `${yyyy}-${mm}-${dd}`;
                          setAvailabilityDate((prev) => prev || isoDate);
                          setBookingModal(true);
                        }}
                        className="flex items-center justify-center gap-2"
                      >
                        <FiCalendar className="w-4 h-4" />
                        Book Consultation
                      </Button>
                      <Button
                        variant="secondary"
                        className="flex items-center justify-center gap-2"
                      >
                        <FiMessageCircle className="w-4 h-4" />
                        Send Message
                      </Button>
                    </div>
                  </Card>

                  <Card className="mb-6">
                    <h2 className="text-xl font-bold mb-6 text-text-primary flex items-center gap-2">
                      <FiClock className="w-5 h-5" />
                      Check Availability
                    </h2>
                    <div className="flex gap-3 items-end flex-wrap mb-4">
                      <div className="flex-1 min-w-[220px]">
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
                        className="flex items-center gap-2"
                      >
                        <FiClock className="w-4 h-4" />
                        Load Slots
                      </Button>
                    </div>
                    <div className="mt-4">
                      {slotsLoading ? (
                        <div className="flex items-center gap-2 text-text-secondary">
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          <span>Loading available slots...</span>
                        </div>
                      ) : availableSlots.length === 0 ? (
                        <div className="p-4 bg-surface rounded-lg border border-border">
                          <div className="flex items-center gap-2 text-text-secondary">
                            <FiAlertCircle className="w-5 h-5" />
                            <span>
                              {availabilityDate
                                ? "No slots available for this date."
                                : "Select a date to see available slots."}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {availableSlots.map((s) => (
                            <Badge
                              key={`${s.start}-${s.end}`}
                              variant="secondary"
                              className="text-sm py-2 px-4 cursor-pointer hover:bg-primary hover:text-primary-text transition-colors"
                              onClick={() => {
                                setBookingData((p) => ({ ...p, slot: `${s.start}-${s.end}` }));
                                setBookingModal(true);
                              }}
                            >
                              <FiClock className="w-3 h-3 inline mr-1" />
                              {s.start} - {s.end}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                </>
              )}

              {/* Reviews Section */}
              <Card>
                <h2 className="text-xl font-bold mb-6 text-text-primary flex items-center gap-2">
                  <FiStar className="w-5 h-5" />
                  Client Reviews
                </h2>
                {lawyer?.ratingCount > 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
                      <FiStar className="w-8 h-8 text-warning" />
                    </div>
                    <p className="text-text-secondary font-medium">Reviews coming soon</p>
                    <p className="text-sm text-text-muted mt-2">
                      Detailed reviews will be displayed here
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mx-auto mb-4">
                      <FiMessageCircle className="w-8 h-8 text-text-secondary" />
                    </div>
                    <p className="text-text-secondary font-medium mb-2">No reviews yet</p>
                    <p className="text-sm text-text-muted">
                      Be the first to review this lawyer after your consultation
                    </p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

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
      </>
    </StateHandler>
  );
}
