import { ApiError } from "../helpers/apiError.js";
import NotificationPreference from "../models/NotificationPreference.js";
import User from "../models/User.js";
import { NOTIFICATION_CHANNELS } from "../config/notification.constants.js";
import {
  buildPreferencesView,
  getDefaultPreferenceMap,
  getSupportedChannels,
  getTypesForRole,
  isChannelEnabledByPreference,
  isMandatoryChannel
} from "../config/notification.preferences.js";

function mapToPlain(preferences) {
  if (!preferences || typeof preferences !== "object") return {};
  return preferences;
}

async function getOrCreateDoc(userId) {
  let doc = await NotificationPreference.findOne({ userId });
  if (!doc) {
    doc = await NotificationPreference.create({ userId, preferences: {} });
  }
  return doc;
}

export async function getPreferencesForUser(userId) {
  const user = await User.findById(userId).select("role").lean();
  if (!user) throw new ApiError(404, "User not found");

  const doc = await NotificationPreference.findOne({ userId }).lean();
  const stored = mapToPlain(doc?.preferences);

  return {
    role: user.role,
    categories: buildPreferencesView(user.role, stored),
    preferences: stored
  };
}

export async function getStoredPreferencesMap(userId) {
  const doc = await NotificationPreference.findOne({ userId }).lean();
  return mapToPlain(doc?.preferences);
}

export async function updatePreference({ userId, type, channel, enabled }) {
  const user = await User.findById(userId).select("role").lean();
  if (!user) throw new ApiError(404, "User not found");

  if (!getTypesForRole(user.role).includes(type)) {
    throw new ApiError(400, "Notification type is not available for your account");
  }

  if (!getSupportedChannels(type).includes(channel)) {
    throw new ApiError(400, "Channel is not available for this notification type");
  }

  if (isMandatoryChannel(type, channel)) {
    throw new ApiError(400, "This notification cannot be disabled");
  }

  if (typeof enabled !== "boolean") {
    throw new ApiError(400, "enabled must be a boolean");
  }

  const doc = await getOrCreateDoc(userId);
  const current = { ...(doc.preferences?.[type] || {}) };
  current[channel] = enabled;
  doc.preferences = { ...doc.preferences, [type]: current };
  doc.markModified("preferences");
  await doc.save();

  return getPreferencesForUser(userId);
}

export async function applyBulkAction({ userId, action }) {
  const user = await User.findById(userId).select("role").lean();
  if (!user) throw new ApiError(404, "User not found");

  const types = getTypesForRole(user.role);

  if (action === "reset") {
    await NotificationPreference.deleteOne({ userId });
    return getPreferencesForUser(userId);
  }

  const channelActions = {
    enable_all_email: { channel: NOTIFICATION_CHANNELS.EMAIL, enabled: true },
    disable_all_email: { channel: NOTIFICATION_CHANNELS.EMAIL, enabled: false },
    enable_all_in_app: { channel: NOTIFICATION_CHANNELS.IN_APP, enabled: true },
    disable_all_in_app: { channel: NOTIFICATION_CHANNELS.IN_APP, enabled: false }
  };

  const config = channelActions[action];
  if (!config) throw new ApiError(400, "Invalid bulk action");

  const doc = await getOrCreateDoc(userId);
  const nextPreferences = { ...(doc.preferences || {}) };

  for (const type of types) {
    if (!getSupportedChannels(type).includes(config.channel)) continue;
    if (isMandatoryChannel(type, config.channel)) continue;

    nextPreferences[type] = {
      ...(nextPreferences[type] || {}),
      [config.channel]: config.enabled
    };
  }

  doc.preferences = nextPreferences;
  doc.markModified("preferences");
  await doc.save();

  return getPreferencesForUser(userId);
}

export function isNotificationChannelEnabled(type, channel, storedPreferences = {}) {
  return isChannelEnabledByPreference(type, channel, storedPreferences);
}

export function getDefaultPreferencesForRole(role) {
  return getDefaultPreferenceMap(role);
}
