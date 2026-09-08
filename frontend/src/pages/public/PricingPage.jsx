import { Link } from "react-router-dom";
import { Navbar } from "../../components/layout";
import Footer from "../../components/Footer";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../context/ThemeContext";
import { FiArrowRight } from "react-icons/fi";
import ComingSoonPlanCards from "./marketing/ComingSoonPlanCards";
import "./marketing/marketing-motion.css";

/**
 * Public pricing preview. Checkout is not live yet — cards are non-clickable.
 */
export default function PricingPage() {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();

  const audienceNote =
    user?.role === "CLIENT"
      ? "You don’t need a subscription to book lawyers. Plans below are for legal professionals."
      : user?.role === "LAWYER"
        ? "Self-serve billing is coming soon. Request a demo if you need a walkthrough for your firm."
        : "For lawyers and firms. Clients browse and book without a subscription.";

  return (
    <div
      className={`min-h-screen relative text-text-primary flex flex-col ${
        isDarkMode ? "mkt-landing--dark bg-background" : "mkt-landing--light bg-background"
      }`}
    >
      <Navbar />

      <main className="flex-1">
        {/* Hero Section with Radial Gradient Background */}
        <header className="relative border-b border-border overflow-x-clip">
          <div className="hero-bg-frame" aria-hidden>
            <div
              className={
                isDarkMode
                  ? "ken-burns absolute inset-0 bg-[radial-gradient(900px_420px_at_50%_-10%,rgba(10,107,110,0.35),transparent_60%)]"
                  : "ken-burns absolute inset-0 bg-[radial-gradient(900px_420px_at_50%_-10%,rgba(8,84,86,0.14),transparent_60%)]"
              }
            />
          </div>

          <div className="relative max-w-[1100px] mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center">
            <p className="text-xs sm:text-sm font-semibold text-primary m-0 mb-3 tracking-wide uppercase">
              Pricing
            </p>
            <h1 className="text-3xl sm:text-5xl font-bold text-text-primary m-0 leading-tight">
              Plans for modern legal practice
            </h1>
            <p className="text-base sm:text-lg text-text-secondary max-w-[640px] mx-auto m-0 mt-4 leading-relaxed">
              Trial, Adal Base, Adal Max, and Law Firm plans for cases, AI, documents, and seats.
              Marketplace profile and bookings stay available for lawyers on every plan.
            </p>
            <p className="text-xs sm:text-sm text-text-muted max-w-[560px] mx-auto m-0 mt-3">
              {audienceNote}
            </p>
            <div className="mt-6">
              <span className="inline-flex items-center px-3.5 py-1.5 rounded-full border border-border bg-card/80 backdrop-blur-sm text-xs font-semibold text-text-secondary shadow-sm">
                Self-serve checkout coming soon
              </span>
            </div>
          </div>
        </header>

        {/* Pricing Cards & Audience Cards Section */}
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <ComingSoonPlanCards
            footnote="First month is a Base-level trial. Paid billing starts after trial when checkout goes live. Billing will be per workspace — firm members inherit the active firm plan."
          />

          <div className="mt-14 grid gap-4 sm:grid-cols-2 max-w-3xl mx-auto">
            <div className="mkt-card rounded-xl border border-border bg-card p-5 text-left">
              <h2 className="text-base font-semibold text-text-primary m-0">For clients</h2>
              <p className="text-sm text-text-secondary m-0 mt-2">
                No subscription. Search verified lawyers, book consultations, and pay per session.
              </p>
              <Link
                to={user ? "/lawyers" : "/register?role=client"}
                className="inline-flex items-center gap-1 text-sm font-semibold text-link no-underline mt-3 hover:underline"
              >
                {user ? "Find lawyers" : "Create client account"}
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="mkt-card rounded-xl border border-border bg-card p-5 text-left">
              <h2 className="text-base font-semibold text-text-primary m-0">Want a walkthrough?</h2>
              <p className="text-sm text-text-secondary m-0 mt-2">
                Book a demo or request setup help for your firm—no account required.
              </p>
              <Link
                to="/request-demo"
                className="inline-flex items-center gap-1 text-sm font-semibold text-link no-underline mt-3 hover:underline"
              >
                Request a demo
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}