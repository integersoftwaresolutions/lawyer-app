import { NOTIFICATION_TYPES } from "../../config/notification.constants.js";
import { notifyAsync } from "../notification.service.js";

function profilePathForRole(role) {
  if (role === "LAWYER") return "/lawyer/settings/profile";
  if (role === "CLIENT") return "/client/settings/profile";
  if (role === "ADMIN") return "/admin/overview";
  return "/";
}

export function notifyEmailVerified(user) {
  if (!user?._id) return;

  notifyAsync(NOTIFICATION_TYPES.EMAIL_VERIFIED, [{
    userId: user._id.toString(),
    variables: {
      profileUrl: profilePathForRole(user.role)
    }
  }]);
}

export function notifyPasswordChanged(user) {
  if (!user?._id) return;

  notifyAsync(NOTIFICATION_TYPES.PASSWORD_CHANGED, [{
    userId: user._id.toString(),
    variables: {}
  }]);
}
