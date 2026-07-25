export function getDashboardPath(role) {
  switch (role) {
    case "ADMIN":
      return "/admin/overview";
    case "LAWYER":
      return "/lawyer/overview";
    case "CLIENT":
      return "/client/overview";
    default:
      return "/login";
  }
}

export function getProfilePath(role) {
  switch (role) {
    case "ADMIN":
      return "/admin/account/security";
    case "LAWYER":
      return "/lawyer/settings/profile";
    case "CLIENT":
      return "/client/settings/profile";
    default:
      return "/login";
  }
}

export function getNotificationsPath(role) {
  switch (role) {
    case "ADMIN":
      return "/admin/notifications";
    case "LAWYER":
      return "/lawyer/notifications";
    case "CLIENT":
      return "/client/notifications";
    default:
      return "/login";
  }
}
