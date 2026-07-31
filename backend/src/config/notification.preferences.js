import { NOTIFICATION_TYPES, NOTIFICATION_CHANNELS } from "./notification.constants.js";
import { ROLES } from "./constants.js";
import { getDefaultChannels } from "../notifications/in-app.registry.js";

/** Mandatory notifications — always delivered; shown as locked in settings UI. */
export const MANDATORY_NOTIFICATION_CHANNELS = {
  [NOTIFICATION_TYPES.EMAIL_VERIFICATION]: [NOTIFICATION_CHANNELS.EMAIL],
  [NOTIFICATION_TYPES.PASSWORD_RESET]: [NOTIFICATION_CHANNELS.EMAIL],
  [NOTIFICATION_TYPES.PASSWORD_CHANGED]: [NOTIFICATION_CHANNELS.IN_APP],
  [NOTIFICATION_TYPES.EMAIL_VERIFIED]: [NOTIFICATION_CHANNELS.IN_APP]
};

export const NOTIFICATION_CATEGORIES = {
  BOOKINGS: "bookings",
  REMINDERS: "reminders",
  VERIFICATION: "verification",
  CASES: "cases",
  ACCOUNT: "account"
};

const TYPE_META = {
  [NOTIFICATION_TYPES.BOOKING_CONFIRMED]: {
    label: "Booking confirmed",
    description: "When a consultation is successfully booked",
    category: NOTIFICATION_CATEGORIES.BOOKINGS,
    roles: [ROLES.CLIENT, ROLES.LAWYER]
  },
  [NOTIFICATION_TYPES.BOOKING_REMINDER]: {
    label: "Booking reminder",
    description: "Reminders before an upcoming consultation",
    category: NOTIFICATION_CATEGORIES.REMINDERS,
    roles: [ROLES.CLIENT, ROLES.LAWYER]
  },
  [NOTIFICATION_TYPES.BOOKING_RESCHEDULED]: {
    label: "Booking rescheduled",
    description: "When a consultation time is changed",
    category: NOTIFICATION_CATEGORIES.BOOKINGS,
    roles: [ROLES.CLIENT, ROLES.LAWYER]
  },
  [NOTIFICATION_TYPES.BOOKING_CANCELLED]: {
    label: "Booking cancelled",
    description: "When a consultation is cancelled",
    category: NOTIFICATION_CATEGORIES.BOOKINGS,
    roles: [ROLES.CLIENT, ROLES.LAWYER]
  },
  [NOTIFICATION_TYPES.PLANNER_REMINDER]: {
    label: "Planner reminder",
    description: "Reminders for events on your smart planner",
    category: NOTIFICATION_CATEGORIES.REMINDERS,
    roles: [ROLES.LAWYER]
  },
  [NOTIFICATION_TYPES.VERIFICATION_DOCUMENTS_RECEIVED]: {
    label: "Document received",
    description: "When your verification document is received for review",
    category: NOTIFICATION_CATEGORIES.VERIFICATION,
    roles: [ROLES.LAWYER]
  },
  [NOTIFICATION_TYPES.VERIFICATION_APPROVED]: {
    label: "Verification approved",
    description: "When your lawyer verification is approved",
    category: NOTIFICATION_CATEGORIES.VERIFICATION,
    roles: [ROLES.LAWYER]
  },
  [NOTIFICATION_TYPES.VERIFICATION_REJECTED]: {
    label: "Verification rejected",
    description: "When your lawyer verification is not approved",
    category: NOTIFICATION_CATEGORIES.VERIFICATION,
    roles: [ROLES.LAWYER]
  },
  [NOTIFICATION_TYPES.VERIFICATION_DOCUMENT_REJECTED]: {
    label: "Document rejected",
    description: "When a verification document needs to be re-uploaded",
    category: NOTIFICATION_CATEGORIES.VERIFICATION,
    roles: [ROLES.LAWYER]
  },
  [NOTIFICATION_TYPES.CASE_ASSIGNED]: {
    label: "Case assignment",
    description: "When you are assigned to a case as primary or collaborator",
    category: NOTIFICATION_CATEGORIES.CASES,
    roles: [ROLES.LAWYER]
  },
  [NOTIFICATION_TYPES.CASE_STATUS_CHANGED]: {
    label: "Case status changes",
    description: "When a case you are on changes status",
    category: NOTIFICATION_CATEGORIES.CASES,
    roles: [ROLES.LAWYER]
  },
  [NOTIFICATION_TYPES.CASE_DOCUMENT_ATTACHED]: {
    label: "Case documents",
    description: "When a document is attached to a case you are on",
    category: NOTIFICATION_CATEGORIES.CASES,
    roles: [ROLES.LAWYER]
  },
  [NOTIFICATION_TYPES.EMAIL_VERIFICATION]: {
    label: "Email verification code",
    description: "One-time code to verify your email address",
    category: NOTIFICATION_CATEGORIES.ACCOUNT,
    roles: [ROLES.CLIENT, ROLES.LAWYER]
  },
  [NOTIFICATION_TYPES.PASSWORD_RESET]: {
    label: "Password reset code",
    description: "One-time code to reset your password",
    category: NOTIFICATION_CATEGORIES.ACCOUNT,
    roles: [ROLES.CLIENT, ROLES.LAWYER]
  },
  [NOTIFICATION_TYPES.EMAIL_VERIFIED]: {
    label: "Email verified",
    description: "Confirmation when your email is verified",
    category: NOTIFICATION_CATEGORIES.ACCOUNT,
    roles: [ROLES.CLIENT, ROLES.LAWYER]
  },
  [NOTIFICATION_TYPES.PASSWORD_CHANGED]: {
    label: "Password changed",
    description: "Alert when your password is updated",
    category: NOTIFICATION_CATEGORIES.ACCOUNT,
    roles: [ROLES.CLIENT, ROLES.LAWYER]
  }
};

const CATEGORY_ORDER = [
  NOTIFICATION_CATEGORIES.BOOKINGS,
  NOTIFICATION_CATEGORIES.REMINDERS,
  NOTIFICATION_CATEGORIES.CASES,
  NOTIFICATION_CATEGORIES.VERIFICATION,
  NOTIFICATION_CATEGORIES.ACCOUNT
];

const CATEGORY_LABELS = {
  [NOTIFICATION_CATEGORIES.BOOKINGS]: "Bookings",
  [NOTIFICATION_CATEGORIES.REMINDERS]: "Reminders",
  [NOTIFICATION_CATEGORIES.CASES]: "Cases",
  [NOTIFICATION_CATEGORIES.VERIFICATION]: "Verification",
  [NOTIFICATION_CATEGORIES.ACCOUNT]: "Account & security"
};

export function isMandatoryChannel(type, channel) {
  return (MANDATORY_NOTIFICATION_CHANNELS[type] || []).includes(channel);
}

export function getSupportedChannels(type) {
  return getDefaultChannels(type);
}

export function getTypesForRole(role) {
  return Object.entries(TYPE_META)
    .filter(([, meta]) => meta.roles.includes(role))
    .map(([type]) => type);
}

export function getDefaultPreferenceMap(role) {
  const map = {};
  for (const type of getTypesForRole(role)) {
    const channels = getSupportedChannels(type);
    map[type] = {};
    for (const channel of channels) {
      map[type][channel] = true;
    }
  }
  return map;
}

export function buildPreferencesView(role, storedPreferences = {}) {
  const types = getTypesForRole(role);
  const byCategory = new Map();

  for (const type of types) {
    const meta = TYPE_META[type];
    const supported = getSupportedChannels(type);
    const stored = storedPreferences[type] || {};

    const channels = {};
    for (const channel of supported) {
      const mandatory = isMandatoryChannel(type, channel);
      const defaultEnabled = true;
      channels[channel] = {
        supported: true,
        enabled: mandatory ? true : stored[channel] !== false,
        mandatory,
        configurable: !mandatory
      };
    }

    const item = {
      type,
      label: meta.label,
      description: meta.description,
      category: meta.category,
      channels
    };

    if (!byCategory.has(meta.category)) {
      byCategory.set(meta.category, []);
    }
    byCategory.get(meta.category).push(item);
  }

  return CATEGORY_ORDER
    .filter((id) => byCategory.has(id))
    .map((id) => ({
      id,
      label: CATEGORY_LABELS[id],
      items: byCategory.get(id)
    }));
}

export function isChannelEnabledByPreference(type, channel, storedPreferences = {}) {
  if (isMandatoryChannel(type, channel)) return true;
  if (!getSupportedChannels(type).includes(channel)) return false;

  const stored = storedPreferences[type];
  if (!stored || stored[channel] === undefined) return true;
  return stored[channel] !== false;
}
