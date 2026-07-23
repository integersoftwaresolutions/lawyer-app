import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../helpers/response.helper.js";
import { ApiError } from "../helpers/apiError.js";
import * as notificationsService from "../services/notifications.service.js";
import * as notificationPreferencesService from "../services/notificationPreferences.service.js";
import { NOTIFICATION_CHANNELS } from "../config/notification.constants.js";

const r = Router();

r.use(authMiddleware);

r.get("/preferences", asyncHandler(async (req, res) => {
  const out = await notificationPreferencesService.getPreferencesForUser(req.user.id);
  return sendSuccess(res, { message: "Notification preferences", data: out });
}));

r.patch("/preferences", asyncHandler(async (req, res) => {
  const { type, channel, enabled } = req.body;

  if (!type || !channel || enabled === undefined) {
    throw new ApiError(400, "type, channel, and enabled are required");
  }

  if (!Object.values(NOTIFICATION_CHANNELS).includes(channel)) {
    throw new ApiError(400, "Invalid channel");
  }

  const out = await notificationPreferencesService.updatePreference({
    userId: req.user.id,
    type,
    channel,
    enabled: Boolean(enabled)
  });

  return sendSuccess(res, { message: "Preference updated", data: out });
}));

r.post("/preferences/bulk", asyncHandler(async (req, res) => {
  const { action } = req.body;
  if (!action) throw new ApiError(400, "action is required");

  const out = await notificationPreferencesService.applyBulkAction({
    userId: req.user.id,
    action
  });

  return sendSuccess(res, { message: "Preferences updated", data: out });
}));

r.get("/", asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const unreadOnly = req.query.unreadOnly === "true";

  const out = await notificationsService.listNotifications({
    userId: req.user.id,
    page,
    limit,
    unreadOnly
  });

  return sendSuccess(res, { message: "Notifications", data: out });
}));

r.get("/unread-count", asyncHandler(async (req, res) => {
  const out = await notificationsService.getUnreadCount(req.user.id);
  return sendSuccess(res, { message: "Unread count", data: out });
}));

r.patch("/:id/read", asyncHandler(async (req, res) => {
  const out = await notificationsService.markAsRead({
    notificationId: req.params.id,
    userId: req.user.id
  });
  return sendSuccess(res, { message: "Notification marked as read", data: out });
}));

r.post("/read-all", asyncHandler(async (req, res) => {
  const out = await notificationsService.markAllAsRead(req.user.id);
  return sendSuccess(res, { message: "All notifications marked as read", data: out });
}));

export default r;
