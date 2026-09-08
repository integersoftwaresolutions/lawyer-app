export const LAWYER_NOT_VERIFIED = "LAWYER_NOT_VERIFIED";

const GATED_PREFIXES = [
  "/lawyer/overview",
  "/lawyer/planner",
  "/lawyer/availability",
  "/lawyer/bookings",
  "/lawyer/earnings",
  "/lawyer/reviews"
];

function normalizePath(pathname) {
  return String(pathname || "").replace(/\/$/, "") || "/";
}

export function isVerificationPath(pathname) {
  const path = normalizePath(pathname);
  return path === "/lawyer/verification" || path.startsWith("/lawyer/verification/");
}

export function isMarketplaceGatedPath(pathname) {
  const path = normalizePath(pathname);
  return GATED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function isLawyerNotVerifiedError(error) {
  if (!error) return false;
  if (typeof error === "string") return /must be verified/i.test(error);
  const data = error?.response?.data;
  if (data?.code === LAWYER_NOT_VERIFIED || error?.code === LAWYER_NOT_VERIFIED) return true;
  const msg = String(data?.message || error?.message || "");
  return /must be verified/i.test(msg);
}

export function getLawyerVerificationStatus(user) {
  if (user?.role !== "LAWYER") return "APPROVED";
  return user.verificationStatus || user.profile?.verificationStatus || "PENDING";
}
