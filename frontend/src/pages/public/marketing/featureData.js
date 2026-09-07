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
  FiSettings,
  FiCpu,
  FiTarget,
  FiBookOpen,
  FiUsers,
  FiBriefcase,
  FiLock,
  FiCheckCircle
} from "react-icons/fi";

export const MARKETPLACE_FEATURES = [
  {
    icon: FiSearch,
    title: "Lawyer search & profiles",
    body: "Browse verified professionals by specialization, location, and availability."
  },
  {
    icon: FiShield,
    title: "Verification & KYC trust",
    body: "Lawyers submit credentials for platform review so clients can hire with confidence."
  },
  {
    icon: FiCalendar,
    title: "Book consultations",
    body: "Schedule CHAT or VIDEO sessions against live availability—no subscription required for clients."
  },
  {
    icon: FiClock,
    title: "Availability management",
    body: "Lawyers publish slots; clients pick times that work and get confirmation instantly."
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
  },
  {
    icon: FiBell,
    title: "Email & in-app alerts",
    body: "Booking, verification, and practice updates land in notifications—with preference controls."
  }
];

export const PRACTICE_FEATURES = [
  {
    icon: FiLayers,
    title: "Case management",
    body: "Workspace-scoped cases with status, priority, parties, court fields, notes, and documents."
  },
  {
    icon: FiBookOpen,
    title: "Case repository",
    body: "My cases, firm shared, and all accessible—plus search and filters in the active workspace."
  },
  {
    icon: FiFolder,
    title: "Legal documents",
    body: "Upload private practice files with Private / Firm / Public visibility for RAG where allowed."
  },
  {
    icon: FiCalendar,
    title: "Smart Planner",
    body: "Calendar events for hearings and work—kept alongside bookings and practice routines."
  },
  {
    icon: FiDollarSign,
    title: "Bookings & earnings",
    body: "Manage marketplace bookings and track earnings while you grow your profile."
  },
  {
    icon: FiSettings,
    title: "Account & workspace settings",
    body: "Profile, security, notifications, and firm profile controls for the active workspace."
  }
];

export const AI_FEATURES = [
  {
    icon: FiCpu,
    title: "AI Assistant",
    body: "Research-mode chat grounded in retrieved legal context for day-to-day practice questions."
  },
  {
    icon: FiTarget,
    title: "Cross-exam practice",
    body: "Practice cross-examination scenarios in a dedicated mode built for preparation."
  },
  {
    icon: FiBookOpen,
    title: "RAG knowledge",
    body: "Retrieval over a shared case-law corpus plus your private documents—scoped to your workspace."
  },
  {
    icon: FiLayers,
    title: "Plan-based usage",
    body: "AI messages and document quotas follow Free, Pro, or Firm limits on the active workspace."
  }
];

export const FIRM_FEATURES = [
  {
    icon: FiBriefcase,
    title: "Personal & firm workspaces",
    body: "Every lawyer starts personal; create or join firms without mixing contexts."
  },
  {
    icon: FiUsers,
    title: "Roles & invites",
    body: "Owner, Admin, Lawyer, Paralegal—or custom roles from a fixed permission catalog."
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
    name: "Free",
    line: "Solo essentials—cases, light AI, and documents on a personal workspace."
  },
  {
    name: "Pro",
    line: "Higher limits for growing practices, with a 14-day Pro trial for new lawyers."
  },
  {
    name: "Firm",
    line: "Team seats, shared quotas, roles, and invites for firm workspaces."
  }
];

export const TRUST_POINTS = [
  {
    icon: FiShield,
    title: "Verified lawyers",
    body: "KYC-style verification builds trust. It is not a paid paywall for using the marketplace."
  },
  {
    icon: FiLock,
    title: "Secure accounts",
    body: "Signed-in sessions use industry-standard auth; sensitive actions stay behind login."
  },
  {
    icon: FiCheckCircle,
    title: "Platform oversight",
    body: "Admins review verification and disputes so the marketplace stays accountable."
  }
];

export const CLIENT_STEPS = [
  { step: "1", title: "Create a client account", body: "Sign up and verify email—no subscription needed." },
  { step: "2", title: "Find & book", body: "Search lawyers, pick a slot, and pay with wallet credits." },
  { step: "3", title: "Meet & follow up", body: "Join chat or video, then review or raise a dispute if needed." }
];

export const LAWYER_STEPS = [
  { step: "1", title: "Join as a lawyer", body: "Create your profile and start a personal workspace (Pro trial available)." },
  { step: "2", title: "Win work & run practice", body: "Take bookings while cases, AI, docs, and planner stay plan-gated." },
  { step: "3", title: "Grow to a firm", body: "Upgrade or create a Firm workspace for seats, roles, and shared quotas." }
];
