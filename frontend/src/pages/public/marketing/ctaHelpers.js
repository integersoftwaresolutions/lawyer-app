import { getDashboardPath } from "../../../utils/authRoutes";
import { BILLING_COMING_SOON } from "../../../config/features";

/**
 * Auth-aware marketing CTAs. Feature content stays public; only destinations/labels change.
 */
export function resolveMarketingCtas(user) {
  const role = user?.role;
  const dashboard = role ? getDashboardPath(role) : null;

  if (role === "CLIENT") {
    return {
      clientPrimary: { label: "Find lawyers", href: "/lawyers" },
      clientSecondary: { label: "Open dashboard", href: dashboard },
      lawyerPrimary: { label: "Browse as client", href: "/lawyers" },
      lawyerSecondary: { label: "Open dashboard", href: dashboard },
      finalPrimary: { label: "Find lawyers", href: "/lawyers" },
      finalSecondary: { label: "Dashboard", href: dashboard }
    };
  }

  if (role === "LAWYER") {
    return {
      clientPrimary: { label: "Browse lawyers", href: "/lawyers" },
      clientSecondary: { label: "Open practice", href: dashboard },
      lawyerPrimary: { label: "Open practice", href: dashboard },
      lawyerSecondary: {
        label: BILLING_COMING_SOON ? "View pricing" : "Billing & plans",
        href: BILLING_COMING_SOON ? "/pricing" : "/lawyer/billing/subscription"
      },
      finalPrimary: { label: "Open practice", href: dashboard },
      finalSecondary: { label: "View pricing", href: "/pricing" }
    };
  }

  if (role === "ADMIN") {
    return {
      clientPrimary: { label: "Admin overview", href: dashboard },
      clientSecondary: { label: "Find lawyers", href: "/lawyers" },
      lawyerPrimary: { label: "Subscriptions", href: "/admin/subscriptions" },
      lawyerSecondary: { label: "View pricing", href: "/pricing" },
      finalPrimary: { label: "Admin overview", href: dashboard },
      finalSecondary: { label: "View pricing", href: "/pricing" }
    };
  }

  // Signed out — practice-first defaults
  return {
    clientPrimary: { label: "I need a lawyer", href: "/register?role=client" },
    clientSecondary: { label: "Browse lawyers", href: "/login?redirect=/lawyers" },
    lawyerPrimary: { label: "Start as a lawyer", href: "/register?role=lawyer" },
    lawyerSecondary: { label: "View pricing", href: "/pricing" },
    finalPrimary: { label: "Start free as a lawyer", href: "/register?role=lawyer" },
    finalSecondary: { label: "Request a demo", href: "/request-demo" }
  };
}
