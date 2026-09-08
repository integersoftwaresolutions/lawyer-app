import { Link, useLocation } from "react-router-dom";
import { FiCheckCircle } from "react-icons/fi";
import Button from "../ui/Button";
import { useLawyerVerification } from "../../hooks/useLawyerVerification";
import { isMarketplaceGatedPath, isVerificationPath } from "../../utils/lawyerVerification";

/** Compact reminder on pages that still work without KYC. */
export default function VerificationStatusBanner() {
  const location = useLocation();
  const { needsVerification, isRejected } = useLawyerVerification();

  if (!needsVerification) return null;
  if (isVerificationPath(location.pathname)) return null;
  if (isMarketplaceGatedPath(location.pathname)) return null;

  return (
    <div className="rounded-xl border border-warning/40 bg-warning-light px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-warning text-warning-text flex items-center justify-center shrink-0">
          <FiCheckCircle className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary m-0">
            {isRejected ? "Verification needs attention" : "Verification required for client bookings"}
          </p>
          <p className="text-xs text-text-secondary m-0 mt-0.5">
            {isRejected
              ? "Resubmit your documents to appear in search and receive consultations."
              : "Complete verification to receive bookings and use availability, planner, and earnings."}
          </p>
        </div>
      </div>
      <Link to="/lawyer/verification" className="no-underline shrink-0">
        <Button size="sm">Go to verification</Button>
      </Link>
    </div>
  );
}
