import { ApiError } from "../helpers/apiError.js";

export function requireRoles(...roles) {
  return (req, _res, next) => {
    if (!req.user) throw new ApiError(401, "Not authenticated");
    if (!roles.includes(req.user.role)) throw new ApiError(403, "Forbidden");
    next();
  };
}
