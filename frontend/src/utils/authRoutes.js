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
      return "/admin/settings";
    case "LAWYER":
      return "/lawyer/profile";
    case "CLIENT":
      return "/client/profile";
    default:
      return "/login";
  }
}
