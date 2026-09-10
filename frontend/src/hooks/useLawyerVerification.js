import { useAuth } from "./useAuth";
import { getLawyerVerificationStatus } from "../utils/lawyerVerification";

/** KYC status for the signed-in lawyer. Non-lawyers are treated as approved. */
export function useLawyerVerification() {
  const { user } = useAuth();
  const isLawyer = user?.role === "LAWYER";
  const status = getLawyerVerificationStatus(user);
  const isApproved = status === "APPROVED";
  const needsVerification = isLawyer && !isApproved;

  return {
    status,
    isApproved,
    needsVerification,
    isRejected: status === "REJECTED",
    isPending: status === "PENDING"
  };
}
