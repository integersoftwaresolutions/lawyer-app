/**
 * Public marketing plan display only — not wired to Stripe / billing catalog yet.
 */
export const PUBLIC_PLANS = [
  {
    key: "trial",
    name: "Trial",
    priceLabel: "Free",
    period: "1 month",
    tagline: "Try Adal with Base-level limits",
    popular: false,
    badge: "First month",
    points: ["1 user", "Limited AI usage", "No card required to start"]
  },
  {
    key: "base",
    name: "Adal Base",
    priceLabel: "Rs 1,000",
    period: "month",
    tagline: "Solo practice essentials",
    popular: false,
    points: ["1 user", "Limited AI usage", "Cases, documents & planner"]
  },
  {
    key: "max",
    name: "Adal Max",
    priceLabel: "Rs 3,000",
    period: "month",
    tagline: "Extended AI for growing solos",
    popular: true,
    points: ["1 user", "Extended AI usage", "Higher practice capacity"]
  },
  {
    key: "firm",
    name: "Law Firm Plan",
    priceLabel: "Rs 4,000",
    period: "month",
    tagline: "Team workspace for small firms",
    popular: false,
    points: ["Up to 5 users", "Team plan", "Roles, invites & shared workspace"]
  },
  {
    key: "firm_max",
    name: "Law Firm Max",
    priceLabel: "Rs 10,000",
    period: "month",
    tagline: "Larger teams with extended AI",
    popular: false,
    points: ["Up to 7 users", "Extended AI usage", "Firm seats & collaboration"]
  }
];

export const PUBLIC_PLAN_TEASERS = PUBLIC_PLANS.filter((p) => p.key !== "trial").map((p) => ({
  name: p.name,
  priceLabel: p.priceLabel,
  line: `${p.points[0]} · ${p.points[1]}`
}));
