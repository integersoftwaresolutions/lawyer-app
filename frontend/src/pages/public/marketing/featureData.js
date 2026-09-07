import {
  FiSearch,
  FiShield,
  FiCalendar,
  FiVideo,
  FiMessageCircle,
  FiCreditCard,
  FiStar,
  FiAlertCircle,
  FiBell,
  FiLayers,
  FiFolder,
  FiClock,
  FiDollarSign,
  FiCpu,
  FiTarget,
  FiBookOpen,
  FiUsers,
  FiBriefcase,
  FiLock,
  FiCheckCircle,
  FiFileText
} from "react-icons/fi";

/** Core product pillars — matches public product message */
export const CORE_PILLARS = [
  {
    icon: FiFolder,
    title: "Case & document management",
    body: "Track matters, parties, status, and files in one workspace—so work stays organized, not scattered."
  },
  {
    icon: FiBriefcase,
    title: "Personal and firm workspaces",
    body: "Start solo on a personal workspace, then create or join a firm without mixing contexts."
  },
  {
    icon: FiUsers,
    title: "Team roles and permissions",
    body: "Owner, Admin, Lawyer, Paralegal—or custom roles from a fixed permission catalog."
  },
  {
    icon: FiCalendar,
    title: "Lawyer bookings & KYC",
    body: "Publish availability, take consultations, and complete verification so clients can hire with confidence."
  },
  {
    icon: FiDollarSign,
    title: "Billing, subscriptions & invoices",
    body: "Adal Base, Adal Max, and Law Firm plans per workspace—with usage limits and invoices (checkout coming soon)."
  },
  {
    icon: FiCpu,
    title: "AI Assistant & document intelligence",
    body: "Research-mode chat grounded in case law and your private documents, with plan-based usage."
  },
  {
    icon: FiClock,
    title: "Smart Planner",
    body: "Calendar for hearings and practice work—alongside marketplace bookings in one place."
  },
  {
    icon: FiBell,
    title: "In-app & email notifications",
    body: "Booking, verification, case, and workspace updates—with preference controls."
  }
];

export const MARKETPLACE_FEATURES = [
  {
    icon: FiSearch,
    title: "Lawyer search & profiles",
    body: "Clients browse verified professionals by specialization, location, and availability."
  },
  {
    icon: FiShield,
    title: "Verification & KYC",
    body: "Lawyers submit credentials for platform review—trust without turning KYC into a product fee."
  },
  {
    icon: FiCalendar,
    title: "Book consultations",
    body: "CHAT or VIDEO sessions against live availability. Clients never need a subscription."
  },
  {
    icon: FiMessageCircle,
    title: "In-session chat",
    body: "Realtime messaging during bookings so conversations stay with the engagement."
  },
  {
    icon: FiVideo,
    title: "Video sessions",
    body: "Join VIDEO consultations when the booking type calls for face-to-face advice."
  },
  {
    icon: FiCreditCard,
    title: "Wallet & credits",
    body: "Clients fund a wallet and pay for marketplace sessions with a clear ledger."
  },
  {
    icon: FiStar,
    title: "Reviews & ratings",
    body: "Leave and read reviews after completed sessions to surface quality."
  },
  {
    icon: FiAlertCircle,
    title: "Disputes",
    body: "Raise issues on bookings; the platform can review and resolve with admin tools."
  }
];

export const PRACTICE_FEATURES = [
  {
    icon: FiLayers,
    title: "Case management",
    body: "Workspace-scoped cases with status, priority, parties, court fields, notes, and documents."
  },
  {
    icon: FiFileText,
    title: "Document library",
    body: "Upload practice files with Private / Firm / Public visibility for secure sharing and AI where allowed."
  },
  {
    icon: FiCalendar,
    title: "Smart Planner",
    body: "Hearings and work events on a practice calendar—kept next to your bookings."
  },
  {
    icon: FiBookOpen,
    title: "Case repository views",
    body: "My cases, firm shared, and all accessible—with search and filters in the active workspace."
  }
];

export const AI_FEATURES = [
  {
    icon: FiCpu,
    title: "AI Assistant",
    body: "Day-to-day research chat grounded in retrieved legal context for your practice questions."
  },
  {
    icon: FiBookOpen,
    title: "Document intelligence",
    body: "Retrieval over shared case law plus your private documents—scoped to the active workspace."
  },
  {
    icon: FiTarget,
    title: "Cross-exam practice",
    body: "Dedicated mode to rehearse cross-examination scenarios during preparation."
  },
  {
    icon: FiLayers,
    title: "Plan-based usage",
    body: "AI messages and document quotas follow Free, Pro, or Firm limits on the workspace."
  }
];

export const FIRM_FEATURES = [
  {
    icon: FiBriefcase,
    title: "Personal & firm workspaces",
    body: "Every lawyer starts personal; create or join firms when you are ready to collaborate."
  },
  {
    icon: FiUsers,
    title: "Roles, invites & permissions",
    body: "Invite colleagues and assign access from a clear permission catalog."
  },
  {
    icon: FiLock,
    title: "Seats & shared quotas",
    body: "Firm plan seats and shared AI, cases, and storage pools for the whole workspace."
  },
  {
    icon: FiCheckCircle,
    title: "Active workspace switcher",
    body: "One active workspace at a time—practice tools and billing always match that context."
  }
];

export const PLAN_TEASERS = [
  {
    name: "Adal Base",
    priceLabel: "Rs 1,000/mo",
    line: "1 user · Limited AI — after a 1-month Base trial"
  },
  {
    name: "Adal Max",
    priceLabel: "Rs 3,000/mo",
    line: "1 user · Extended AI for growing solo practices"
  },
  {
    name: "Law Firm Plan",
    priceLabel: "Rs 4,000/mo",
    line: "Up to 5 users · Team workspace"
  },
  {
    name: "Law Firm Max",
    priceLabel: "Rs 10,000/mo",
    line: "Up to 7 users · Extended AI for firms"
  }
];

export const TRUST_POINTS = [
  {
    icon: FiShield,
    title: "Verified lawyers",
    body: "KYC-style verification builds marketplace trust without gating practice tools behind a fee."
  },
  {
    icon: FiLock,
    title: "Secure accounts",
    body: "Signed-in sessions use industry-standard auth; sensitive actions stay behind login."
  },
  {
    icon: FiBell,
    title: "Stay in the loop",
    body: "In-app and email notifications for bookings, verification, cases, and workspace activity."
  }
];

export const ROADMAP_POINTS = [
  {
    icon: FiCpu,
    title: "Deeper case-level AI",
    body: "Richer assistance tied to specific matters—building on today’s workspace AI and documents."
  },
  {
    icon: FiSearch,
    title: "Improved search & filtering",
    body: "Faster ways to find cases, documents, and people as practices grow."
  }
];

export const CLIENT_STEPS = [
  { step: "1", title: "Create a client account", body: "Sign up and verify email—no subscription needed." },
  { step: "2", title: "Find & book", body: "Search lawyers, pick a slot, and pay with wallet credits." },
  { step: "3", title: "Meet & follow up", body: "Join chat or video, then review or raise a dispute if needed." }
];

export const LAWYER_STEPS = [
  {
    step: "1",
    title: "Join as a lawyer",
    body: "Create your profile and personal workspace—start with a one-month Base-level trial."
  },
  {
    step: "2",
    title: "Run the practice",
    body: "Manage cases, documents, planner, AI, and bookings from one legal workspace."
  },
  {
    step: "3",
    title: "Grow to a firm",
    body: "Invite your team, set roles, and share quotas on a Firm workspace."
  }
];
