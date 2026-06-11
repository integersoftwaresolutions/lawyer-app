import { Link } from "react-router-dom";
import { FiAlertTriangle, FiEdit2, FiExternalLink, FiMessageCircle, FiTrash2, FiX } from "react-icons/fi";
import { Badge, Button, IconButton } from "../ui";
import {
  EVENT_TYPE_LABELS,
  EVENT_VISIBILITY,
  CONSULTATION_TYPE_LABELS,
  getEventColorStyles,
  isPlatformEvent
} from "../../constants/calendar.constants";
import { formatDateTimeRange } from "../../utils/calendar/dateUtils";

const BOOKING_STATUS_LABELS = {
  BOOKED: "Upcoming",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired"
};

const BOOKING_STATUS_VARIANT = {
  BOOKED: "info",
  ACTIVE: "warning",
  COMPLETED: "success",
  CANCELLED: "danger",
  EXPIRED: "default"
};

export default function EventDetailPanel({
  event,
  timezone,
  onClose,
  onEdit,
  onDelete,
  deleting = false
}) {
  if (!event) return null;

  const styles = getEventColorStyles(event);
  const platform = isPlatformEvent(event);
  const bookingStatus = event.metadata?.bookingStatus;
  const statusLabel = BOOKING_STATUS_LABELS[bookingStatus] || bookingStatus;
  const statusVariant = BOOKING_STATUS_VARIANT[bookingStatus] || "default";

  return (
    <aside className="w-full lg:w-[320px] shrink-0 border border-border rounded-xl bg-card flex flex-col overflow-hidden shadow-sm">
      <div className="flex items-start justify-between gap-2 p-4 border-b border-border">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${styles.dot}`} />
            <Badge variant="default" size="sm">
              {EVENT_TYPE_LABELS[event.eventType]}
            </Badge>
            {platform && (
              <Badge variant="success" size="sm">
                Platform
              </Badge>
            )}
            {platform && bookingStatus && (
              <Badge variant={statusVariant} size="sm">
                {statusLabel}
              </Badge>
            )}
          </div>
          <h3 className="text-base font-semibold text-text-primary leading-snug">{event.title}</h3>
        </div>
        <IconButton icon={FiX} label="Close" size="icon-sm" onClick={onClose} />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
        <DetailRow label="When">
          {formatDateTimeRange(event.startAt, event.endAt, timezone)}
          <span className="block text-xs text-text-muted mt-0.5">PKT (Asia/Karachi)</span>
        </DetailRow>

        {event.location && <DetailRow label="Location">{event.location}</DetailRow>}
        {event.caseRef && <DetailRow label="Case reference">{event.caseRef}</DetailRow>}
        {event.clientName && <DetailRow label="Client">{event.clientName}</DetailRow>}
        {event.consultationType && (
          <DetailRow label="Consultation">
            {CONSULTATION_TYPE_LABELS[event.consultationType] || event.consultationType}
          </DetailRow>
        )}

        {event.notes && (
          <DetailRow label="Notes">
            <p className="whitespace-pre-wrap text-text-secondary">{event.notes}</p>
          </DetailRow>
        )}

        {event.reminders?.length > 0 && (
          <DetailRow label="Reminders">
            {event.reminders.map((m) => (
              <span key={m} className="block text-text-secondary">
                {formatReminder(m)}
              </span>
            ))}
          </DetailRow>
        )}

        {!platform && (
          <DetailRow label="Visibility">
            {event.visibility === EVENT_VISIBILITY.SHARED ? "Shared" : "Private"}
          </DetailRow>
        )}

        {platform && (
          <div className="flex gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20 text-xs text-text-secondary">
            <FiAlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <p>
              Synced from a platform booking. Reschedule or cancel via Bookings. You can still edit
              notes and reminders here.
            </p>
          </div>
        )}

        {platform && event.bookingId && (
          <div className="flex flex-col gap-2">
            <Link to={`/chat/${event.bookingId}`} className="no-underline">
              <Button variant="primary" size="sm" icon={FiMessageCircle} fullWidth>
                Open consultation
              </Button>
            </Link>
            <Link to="/lawyer/bookings" className="no-underline">
              <Button variant="secondary" size="sm" icon={FiExternalLink} fullWidth>
                Manage in Bookings
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          icon={FiEdit2}
          fullWidth
          onClick={() => onEdit(event)}
        >
          {platform ? "Edit notes" : "Edit"}
        </Button>
        {!platform && (
          <Button
            variant="danger"
            size="sm"
            icon={FiTrash2}
            loading={deleting}
            onClick={() => onDelete(event)}
          >
            Delete
          </Button>
        )}
      </div>
    </aside>
  );
}

function DetailRow({ label, children }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-1">
        {label}
      </p>
      <div className="text-text-primary">{children}</div>
    </div>
  );
}

function formatReminder(minutes) {
  if (minutes === 15) return "15 minutes before";
  if (minutes === 60) return "1 hour before";
  if (minutes === 1440) return "1 day before";
  if (minutes === 10080) return "1 week before";
  return `${minutes} min before`;
}
