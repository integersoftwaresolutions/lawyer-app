import { useMemo, useState, useEffect, useCallback } from "react";
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
  FiLock,
} from "react-icons/fi";

const SLOT_DURATION_MINUTES = 30;

function todayIsoDate() {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="p-2 rounded-xl bg-surface border border-card-border text-text-secondary shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <h2 className="text-lg font-bold text-text-primary m-0 leading-tight">{title}</h2>
        {subtitle && <p className="text-sm text-text-muted mt-1 m-0">{subtitle}</p>}
      </div>
    </div>
  );
}

function StarRating({ rating, size = "md", showValue = false }) {
  const rounded = Math.round(rating || 0);
  const sizeClass = size === "lg" ? "w-5 h-5" : size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <FiStar
            key={i}
            className={`${sizeClass} ${
              i < rounded ? "text-warning fill-warning" : "text-text-muted"
            }`}
          />
        ))}
      </div>
      {showValue && (
        <span className="text-sm font-semibold text-text-primary tabular-nums">
          {(rating || 0).toFixed(1)}
        </span>
      )}
    </div>
  );
}

function ReviewCard({ review }) {
  const clientLabel =
    review.clientId?.fullName || review.clientId?.email?.split("@")[0] || "Client";

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <div className="rounded-xl border border-card-border bg-surface p-4 transition-colors hover:bg-surface-hover">
      <div className="flex items-start gap-3">
        <Avatar user={review.clientId} name={clientLabel} size="sm" showBorder className="shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary m-0 truncate">{clientLabel}</p>
              <StarRating rating={review.rating} size="sm" />
            </div>
            <span className="text-xs text-text-muted shrink-0">{formatDate(review.createdAt)}</span>
          </div>
          {review.comment ? (
            <p className="text-sm text-text-secondary mt-2.5 mb-0 leading-relaxed">
              &ldquo;{review.comment}&rdquo;
            </p>
          ) : (
            <p className="text-xs text-text-muted mt-2.5 mb-0 italic">No written comment</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatChip({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-card-border bg-surface p-3 sm:p-4">
      <div className="p-2 rounded-lg bg-surface border border-card-border text-text-secondary shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-text-muted m-0">{label}</p>
        <p className="text-sm font-semibold text-text-primary m-0 truncate">{value}</p>
      </div>
    </div>
  );
}

export default function LawyerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookingModal, setBookingModal] = useState(false);
  const [availabilityDate, setAvailabilityDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingData, setBookingData] = useState({ slot: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [contactDetails, setContactDetails] = useState(null);

  const todayIso = useMemo(() => todayIsoDate(), []);

  const slotOptions = useMemo(
    () =>
      (availableSlots || []).map((s) => ({
        value: `${s.start}-${s.end}`,
        label: `${s.start} - ${s.end}`,
      })),
    [availableSlots]
  );

  const openBookingModal = useCallback((slot = "") => {
    const isoDate = todayIsoDate();
    setAvailabilityDate((prev) => (prev && prev >= isoDate ? prev : isoDate));
    setBookingData((p) => ({ ...p, slot: slot || p.slot }));
    setBookingModal(true);
  }, []);

  const loadSlots = async () => {
    if (!availabilityDate) return;
    if (availabilityDate < todayIso) {
      alert("Please select today's date or a future date");
      return;
    }
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
    if (!availabilityDate || !bookingData.slot) {
      alert("Please select a date and an available slot");
      return;
    }
    if (availabilityDate < todayIso) {
      alert("You cannot book a slot in the past");
      return;
    }

    const [slotStart] = bookingData.slot.split("-");
    const startAtIso = new Date(`${availabilityDate}T${slotStart}:00`).toISOString();

    try {
      setSubmitting(true);
      await bookingApi.create({
        lawyerUserId: id,
        startAt: startAtIso,
        durationMinutes: SLOT_DURATION_MINUTES,
        consultationType: "CHAT_VIDEO",
        notes: bookingData.notes,
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

  const {
    loading: reviewsLoading,
    error: reviewsError,
    data: reviewsData,
    retry: retryReviews,
  } = useStateHandler(
    async () => {
      if (!id) return [];
      const res = await lawyerApi.getLawyerReviews(id, { limit: 20 });
      return res.data || [];
    },
    { dependencies: [id] }
  );

  const lawyer = data;
  const reviews = reviewsData || [];
  const isClient = user?.role === "CLIENT";
  const hasContact =
    contactDetails && (contactDetails.phone || contactDetails.email || contactDetails.whatsapp);
  const estimatedCost = Math.round(((lawyer?.hourlyRate || 0) * SLOT_DURATION_MINUTES) / 60);

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
    return () => {
      cancelled = true;
    };
  }, [id, isClient, lawyer]);

  const bookingSidebar = isClient && (
    <div className="space-y-4">
      <Card padding="p-5">
        <div className="text-center mb-5">
          <p className="text-xs uppercase tracking-wider text-text-muted m-0 mb-1">Consultation rate</p>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold text-text-primary tabular-nums">
              ${lawyer?.hourlyRate || 0}
            </span>
            <span className="text-sm text-text-secondary">/ hour</span>
          </div>
          <p className="text-xs text-text-muted mt-2 m-0">
            30-min session · est. ${estimatedCost}
          </p>
        </div>
        <div className="space-y-2.5">
          <Button fullWidth icon={FiCalendar} onClick={() => openBookingModal()}>
            Book Consultation
          </Button>
          <Button fullWidth variant="secondary" outline icon={FiMessageCircle} onClick={() => openBookingModal()}>
            Start Session
          </Button>
        </div>
      </Card>

      <Card padding="p-5">
        <SectionHeader
          icon={FiClock}
          title="Availability"
          subtitle="Pick a date to see open slots"
        />
        <div className="space-y-3">
          <Input
            label="Date"
            type="date"
            min={todayIso}
            value={availabilityDate}
            containerClassName="mb-0"
            onChange={(e) => {
              setAvailabilityDate(e.target.value);
              setAvailableSlots([]);
              setBookingData((p) => ({ ...p, slot: "" }));
            }}
          />
          <Button
            variant="secondary"
            outline
            fullWidth
            icon={FiClock}
            loading={slotsLoading}
            onClick={loadSlots}
            disabled={!availabilityDate}
          >
            Load Slots
          </Button>
          <div className="pt-1">
            {slotsLoading ? (
              <div className="flex items-center justify-center gap-2 py-4 text-sm text-text-secondary">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Loading slots…
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-background p-4 text-center">
                <FiAlertCircle className="w-5 h-5 text-text-muted mx-auto mb-2" />
                <p className="text-sm text-text-secondary m-0">
                  {availabilityDate ? "No slots for this date." : "Select a date first."}
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableSlots.map((s) => {
                  const slotValue = `${s.start}-${s.end}`;
                  return (
                    <button
                      key={slotValue}
                      type="button"
                      onClick={() => openBookingModal(slotValue)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-card-border bg-surface px-3 py-2 text-xs font-medium text-text-primary transition-colors hover:border-card-border hover:bg-surface-hover"
                    >
                      <FiClock className="w-3 h-3 shrink-0" />
                      {s.start} – {s.end}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card
        padding="p-5"
        className={
          hasContact
            ? "border-l-4 border-l-success"
            : "border border-dashed border-card-border bg-card"
        }
      >
        <SectionHeader
          icon={hasContact ? FiPhone : FiLock}
          title="Contact"
          subtitle={
            hasContact
              ? "Unlocked after your consultation"
              : "Book a session to unlock contact details"
          }
        />
        {contactDetails === null ? (
          <div className="flex items-center gap-3 text-text-muted text-sm py-2">
            <span className="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Checking access…
          </div>
        ) : hasContact ? (
          <div className="space-y-2">
            {contactDetails.phone && (
              <a
                href={`tel:${contactDetails.phone}`}
                className="flex items-center gap-3 rounded-xl border border-card-border bg-surface px-3 py-2.5 text-sm transition-colors hover:bg-surface-hover"
              >
                <FiPhone className="w-4 h-4 text-primary shrink-0" />
                <span className="font-medium text-text-primary">{contactDetails.phone}</span>
              </a>
            )}
            {contactDetails.whatsapp && (
              <a
                href={`https://wa.me/${contactDetails.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-xl border border-card-border bg-surface px-3 py-2.5 text-sm transition-colors hover:bg-surface-hover"
              >
                <FiMessageCircle className="w-4 h-4 text-primary shrink-0" />
                <span className="font-medium text-text-primary">{contactDetails.whatsapp}</span>
              </a>
            )}
            {contactDetails.email && (
              <a
                href={`mailto:${contactDetails.email}`}
                className="flex items-center gap-3 rounded-xl border border-card-border bg-surface px-3 py-2.5 text-sm transition-colors hover:bg-surface-hover break-all"
              >
                <FiMail className="w-4 h-4 text-primary shrink-0" />
                <span className="font-medium text-text-primary">{contactDetails.email}</span>
              </a>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-text-secondary m-0 leading-relaxed">
              Phone, WhatsApp, and email are shared after you complete a consultation with this
              lawyer.
            </p>
            <Button size="sm" icon={FiCalendar} onClick={() => openBookingModal()}>
              Book to unlock
            </Button>
          </div>
        )}
      </Card>
    </div>
  );

  return (
    <StateHandler loading={loading} error={error} retry={retry}>
      <>
        <Navbar />
        {!lawyer ? (
          <div className="min-h-screen bg-background text-text-primary flex items-center justify-center px-6">
            <div className="text-center max-w-sm">
              <div className="w-20 h-20 rounded-2xl bg-surface border border-card-border flex items-center justify-center mx-auto mb-6">
                <FiUser className="w-10 h-10 text-text-secondary" />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-text-primary">Lawyer not found</h3>
              <p className="text-text-secondary mb-6">This profile doesn&apos;t exist or was removed.</p>
              <Button variant="secondary" icon={FiArrowLeft} onClick={() => navigate(-1)}>
                Back to Search
              </Button>
            </div>
          </div>
        ) : (
          <div className="min-h-screen bg-background text-text-primary">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
              <Button
                variant="ghost"
                size="sm"
                icon={FiArrowLeft}
                onClick={() => navigate(-1)}
                className="mb-5 -ml-2"
              >
                Back to Search
              </Button>

              {/* Hero */}
              <div className="relative rounded-2xl border border-card-border overflow-hidden mb-6 shadow-sm bg-card">
                <div className="relative p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row gap-6 items-start">
                    <Avatar
                      user={lawyer}
                      size="2xl"
                      showBorder
                      className="border-4 border-card shadow-lg shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-text-primary m-0 leading-tight">
                          {lawyer?.fullName || "Lawyer"}
                        </h1>
                        {lawyer?.verificationStatus === "APPROVED" && (
                          <Badge variant="success" className="inline-flex items-center gap-1">
                            <FiShield className="w-3 h-3" />
                            Verified
                          </Badge>
                        )}
                        {lawyer?.isFeatured && lawyer?.featuredUntil && (
                          <Badge variant="warning">Featured</Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
                        <StarRating rating={lawyer?.ratingAvg} size="md" showValue />
                        {lawyer?.ratingCount > 0 && (
                          <span className="text-sm text-text-secondary">
                            {lawyer.ratingCount} review{lawyer.ratingCount !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>

                      {lawyer?.specialization?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {lawyer.specialization.slice(0, 4).map((spec) => (
                            <Badge key={spec} variant="secondary" size="sm">
                              {spec}
                            </Badge>
                          ))}
                          {lawyer.specialization.length > 4 && (
                            <Badge variant="secondary" size="sm">
                              +{lawyer.specialization.length - 4} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {!isClient && (
                      <Card padding="p-5" className="w-full sm:w-auto sm:min-w-[200px] text-center shrink-0">
                        <p className="text-xs uppercase tracking-wider text-text-muted m-0 mb-1">Rate</p>
                        <p className="text-3xl font-bold text-text-primary m-0 tabular-nums">
                          ${lawyer?.hourlyRate || 0}
                          <span className="text-sm font-normal text-text-secondary">/hr</span>
                        </p>
                      </Card>
                    )}
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-6 border-t border-border">
                    <StatChip
                      icon={FiMapPin}
                      label="Location"
                      value={lawyer?.city || "Not specified"}
                    />
                    <StatChip
                      icon={FiBriefcase}
                      label="Experience"
                      value={`${lawyer?.experienceYears || 0} years`}
                    />
                    <StatChip
                      icon={FiDollarSign}
                      label="Hourly rate"
                      value={`$${lawyer?.hourlyRate || 0}/hr`}
                    />
                    <StatChip
                      icon={FiStar}
                      label="Reviews"
                      value={
                        lawyer?.ratingCount > 0
                          ? `${(lawyer.ratingAvg || 0).toFixed(1)} · ${lawyer.ratingCount}`
                          : "No reviews yet"
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main content */}
                <div className="lg:col-span-2 space-y-6">
                  {lawyer?.bio && (
                    <Card padding="p-5 sm:p-6">
                      <SectionHeader icon={FiUser} title="About" subtitle="Professional background" />
                      <p className="text-base leading-relaxed text-text-secondary whitespace-pre-line m-0">
                        {lawyer.bio}
                      </p>
                    </Card>
                  )}

                  {lawyer?.specialization?.length > 0 && (
                    <Card padding="p-5 sm:p-6">
                      <SectionHeader
                        icon={FiCheckCircle}
                        title="Specializations"
                        subtitle="Areas of legal expertise"
                      />
                      <div className="flex flex-wrap gap-2">
                        {lawyer.specialization.map((spec) => (
                          <span
                            key={spec}
                            className="inline-flex items-center rounded-xl border border-card-border bg-surface px-4 py-2 text-sm font-medium text-text-primary"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </Card>
                  )}

                  <Card padding="p-5 sm:p-6">
                    <SectionHeader
                      icon={FiStar}
                      title="Client Reviews"
                      subtitle={
                        lawyer?.ratingCount > 0
                          ? `${lawyer.ratingCount} verified review${lawyer.ratingCount !== 1 ? "s" : ""}`
                          : "Reviews from completed consultations"
                      }
                    />

                    {reviewsLoading ? (
                      <div className="flex items-center justify-center gap-2 py-12 text-text-secondary">
                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        Loading reviews…
                      </div>
                    ) : reviewsError ? (
                      <div className="text-center py-10">
                        <p className="text-text-secondary mb-3">Couldn&apos;t load reviews.</p>
                        <Button variant="secondary" size="sm" onClick={retryReviews}>
                          Try again
                        </Button>
                      </div>
                    ) : reviews.length > 0 ? (
                      <div className="flex flex-col gap-3">
                        {reviews.map((review) => (
                          <ReviewCard key={review._id} review={review} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 rounded-xl border border-dashed border-card-border bg-background">
                        <div className="inline-flex p-3 rounded-2xl bg-surface border border-card-border text-warning mb-4">
                          <FiStar className="w-8 h-8" />
                        </div>
                        <p className="text-base font-medium text-text-primary m-0">No reviews yet</p>
                        <p className="text-sm text-text-muted mt-2 mb-0 max-w-sm mx-auto">
                          {isClient
                            ? "Complete a consultation to be the first to leave a review."
                            : "Reviews appear here after clients complete consultations."}
                        </p>
                      </div>
                    )}
                  </Card>
                </div>

                {/* Sidebar */}
                {isClient ? (
                  <div className="lg:col-span-1">
                    <div className="lg:sticky lg:top-6 space-y-4">{bookingSidebar}</div>
                  </div>
                ) : (
                  <div className="lg:col-span-1">
                    <Card padding="p-5" className="lg:sticky lg:top-6">
                      <SectionHeader
                        icon={FiCalendar}
                        title="Book a consultation"
                        subtitle="Sign in as a client to schedule a session"
                      />
                      <p className="text-sm text-text-secondary m-0 mb-4 leading-relaxed">
                        Create a client account to book consultations, chat with lawyers, and leave
                        reviews.
                      </p>
                      <Button fullWidth onClick={() => navigate("/login")}>
                        Sign in to book
                      </Button>
                    </Card>
                  </div>
                )}
              </div>
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
          <div className="space-y-3">
            <Input
              label="Date"
              type="date"
              min={todayIso}
              value={availabilityDate}
              containerClassName="mb-0"
              onChange={(e) => {
                setAvailabilityDate(e.target.value);
                setAvailableSlots([]);
                setBookingData((p) => ({ ...p, slot: "" }));
              }}
            />

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Button
                  variant="secondary"
                  size="sm"
                  loading={slotsLoading}
                  onClick={loadSlots}
                  disabled={!availabilityDate}
                >
                  Load Slots
                </Button>
                <span className="text-text-muted text-xs">Pick a 30-minute open slot.</span>
              </div>
              <Select
                label="Available slots"
                value={bookingData.slot}
                onChange={(e) => setBookingData((p) => ({ ...p, slot: e.target.value }))}
                placeholder={
                  availabilityDate
                    ? availableSlots.length
                      ? "Select a slot"
                      : "No slots — click Load Slots"
                    : "Select date first"
                }
                options={slotOptions}
                containerClassName="mb-0"
              />
            </div>

            <div className="rounded-xl border border-card-border bg-surface p-4 text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Duration</span>
                <span className="text-text-primary font-medium">30 min</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Consultation</span>
                <span className="text-text-primary font-medium">Chat + Video</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-text-muted">Estimated cost</span>
                <span className="text-text-primary font-semibold">${estimatedCost}</span>
              </div>
            </div>
          </div>
        </Modal>
      </>
    </StateHandler>
  );
}
