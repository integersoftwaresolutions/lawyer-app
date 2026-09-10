import { useLocation } from "react-router-dom";
import {
  FiCalendar,
  FiClock,
  FiDollarSign,
  FiFileText,
  FiHome,
  FiStar
} from "react-icons/fi";
import { useLawyerVerification } from "../../hooks/useLawyerVerification";
import { isMarketplaceGatedPath } from "../../utils/lawyerVerification";
import VerificationRequiredPanel from "./VerificationRequiredPanel";

const PAGE_META = [
  {
    test: (path) => path.startsWith("/lawyer/planner"),
    title: "Smart Planner",
    subtitle: "Hearings, meetings, and deadlines",
    icon: FiCalendar
  },
  {
    test: (path) => path.startsWith("/lawyer/availability"),
    title: "Weekly Availability",
    subtitle: "Set when clients can book consultations",
    icon: FiClock
  },
  {
    test: (path) => path.startsWith("/lawyer/bookings"),
    title: "Bookings",
    subtitle: "Manage upcoming sessions and consultation history",
    icon: FiFileText
  },
  {
    test: (path) => path.startsWith("/lawyer/earnings"),
    title: "Earnings",
    subtitle: "Track payouts, balance, and transaction history",
    icon: FiDollarSign
  },
  {
    test: (path) => path.startsWith("/lawyer/reviews"),
    title: "Client Reviews",
    subtitle: "See what clients are saying about your consultations",
    icon: FiStar
  },
  {
    test: (path) => true,
    title: "Overview",
    subtitle: "Quick snapshot of practice performance",
    icon: FiHome
  }
];

function pageMeta(pathname) {
  const path = String(pathname || "").replace(/\/$/, "") || "/";
  return PAGE_META.find((item) => item.test(path)) || PAGE_META[PAGE_META.length - 1];
}

/** Swap marketplace page bodies when the lawyer is not KYC-approved. */
export default function LawyerMarketplaceGate({ children }) {
  const location = useLocation();
  const { needsVerification, status } = useLawyerVerification();

  if (!needsVerification || !isMarketplaceGatedPath(location.pathname)) {
    return children;
  }

  const meta = pageMeta(location.pathname);
  return (
    <VerificationRequiredPanel
      icon={meta.icon}
      title={meta.title}
      subtitle={meta.subtitle}
      status={status}
    />
  );
}
