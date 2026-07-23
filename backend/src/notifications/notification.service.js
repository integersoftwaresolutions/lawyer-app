import NotificationLog from "../models/NotificationLog.js";
import { NOTIFICATION_CHANNELS } from "../config/notification.constants.js";
import { getDefaultChannels } from "./in-app.registry.js";
import { sendNotificationEmail } from "./channels/email.channel.js";
import { sendInAppNotification } from "./channels/in_app.channel.js";
import {
  getStoredPreferencesMap,
  isNotificationChannelEnabled
} from "../services/notificationPreferences.service.js";
import { isMandatoryChannel } from "../config/notification.preferences.js";

async function shouldDeliver(userId, type, channel, preferenceCache) {
  if (isMandatoryChannel(type, channel)) return true;
  if (!userId) return true;

  if (!preferenceCache.has(userId)) {
    preferenceCache.set(userId, await getStoredPreferencesMap(userId));
  }

  return isNotificationChannelEnabled(type, channel, preferenceCache.get(userId));
}

/**
 * Dispatch a notification to configured channels.
 * @param {string} type - NOTIFICATION_TYPES value
 * @param {Array<{ email?: string, userId?: string, variables?: object }>} recipients
 * @param {object} [options]
 * @param {string[]} [options.channels] - defaults from getDefaultChannels(type)
 */
export async function notify(type, recipients, options = {}) {
  const channels = options.channels || getDefaultChannels(type);
  const list = Array.isArray(recipients) ? recipients : [recipients];
  const metadata = options.metadata || {};
  const preferenceCache = new Map();

  for (const recipient of list) {
    const variables = recipient.variables || {};

    for (const channel of channels) {
      const allowed = await shouldDeliver(recipient.userId, type, channel, preferenceCache);
      if (!allowed) continue;

      if (channel === NOTIFICATION_CHANNELS.EMAIL) {
        if (!recipient.email) continue;
        try {
          await sendNotificationEmail({
            type,
            to: recipient.email,
            variables
          });
          await NotificationLog.create({
            type,
            channel: NOTIFICATION_CHANNELS.EMAIL,
            recipientEmail: recipient.email,
            userId: recipient.userId || null,
            status: "sent",
            metadata
          }).catch(() => {});
        } catch (error) {
          console.error(`[notify] ${type} email failed for ${recipient.email}:`, error.message);
          await NotificationLog.create({
            type,
            channel: NOTIFICATION_CHANNELS.EMAIL,
            recipientEmail: recipient.email,
            userId: recipient.userId || null,
            status: "failed",
            error: error.message,
            metadata
          }).catch(() => {});
        }
      }

      if (channel === NOTIFICATION_CHANNELS.IN_APP) {
        if (!recipient.userId) continue;
        try {
          await sendInAppNotification({
            type,
            userId: recipient.userId,
            variables,
            metadata
          });
          await NotificationLog.create({
            type,
            channel: NOTIFICATION_CHANNELS.IN_APP,
            recipientEmail: recipient.email || "",
            userId: recipient.userId,
            status: "sent",
            metadata
          }).catch(() => {});
        } catch (error) {
          console.error(`[notify] ${type} in-app failed for user ${recipient.userId}:`, error.message);
          await NotificationLog.create({
            type,
            channel: NOTIFICATION_CHANNELS.IN_APP,
            recipientEmail: recipient.email || "",
            userId: recipient.userId,
            status: "failed",
            error: error.message,
            metadata
          }).catch(() => {});
        }
      }
    }
  }
}

/** Fire-and-forget wrapper — does not block the caller. */
export function notifyAsync(type, recipients, options = {}) {
  notify(type, recipients, options).catch((err) => {
    console.error(`[notifyAsync] ${type}:`, err.message);
  });
}
