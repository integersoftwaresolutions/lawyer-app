import { getDashboardPath } from "../../../utils/authRoutes";

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
      lawyerSecondary: { label: "Billing & plans", href: "/lawyer/billing/subscription" },
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

  // Signed out
  return {
    clientPrimary: { label: "I need a lawyer", href: "/register?role=client" },
    clientSecondary: { label: "Browse lawyers", href: "/login?redirect=/lawyers" },
    lawyerPrimary: { label: "I am a lawyer", href: "/register?role=lawyer" },
    lawyerSecondary: { label: "View pricing", href: "/pricing" },
    finalPrimary: { label: "Create free account", href: "/register" },
    finalSecondary: { label: "Sign in", href: "/login" }
  };
}
