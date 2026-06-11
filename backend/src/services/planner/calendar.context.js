import { ApiError } from "../../helpers/apiError.js";
import { CALENDAR_OWNER_ROLES, ROLES } from "../../config/constants.js";

/**
 * Resolves calendar ownership from an authenticated request.
 * Same helper will power client calendar routes in a future phase.
 */
export function resolveCalendarOwner(req, { roleOverride = null } = {}) {
  if (!req.user?.id) throw new ApiError(401, "Authentication required");

  const role = roleOverride || req.user.role;

  if (role === ROLES.LAWYER) {
    return { ownerId: req.user.id, ownerRole: CALENDAR_OWNER_ROLES.LAWYER };
  }
  if (role === ROLES.CLIENT) {
    return { ownerId: req.user.id, ownerRole: CALENDAR_OWNER_ROLES.CLIENT };
  }

  throw new ApiError(403, "Calendar is not available for this role");
}

export function buildOwnerFilter(owner) {
  return { ownerId: owner.ownerId, ownerRole: owner.ownerRole };
}
