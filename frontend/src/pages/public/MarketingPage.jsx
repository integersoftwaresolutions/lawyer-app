import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import {
  FiArrowRight,
  FiBriefcase,
  FiCheck,
  FiUser
} from "react-icons/fi";
import { Navbar } from "../../components/layout";
import Footer from "../../components/Footer";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../hooks/useAuth";
import { resolveMarketingCtas } from "./marketing/ctaHelpers";
import {
  AI_FEATURES,
  CLIENT_STEPS,
  FIRM_FEATURES,
  LAWYER_STEPS,
  MARKETPLACE_FEATURES,
  PLAN_TEASERS,
  PRACTICE_FEATURES,
  TRUST_POINTS
} from "./marketing/featureData";
import { FeatureGrid, SectionHeader } from "./marketing/SectionBits";

function CtaLink({ href, children, variant = "primary", className = "" }) {
  const base =
    "inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold no-underline transition-colors min-h-[44px]";
  const styles =
    variant === "primary"
      ? "bg-primary text-primary-text hover:bg-primary-hover"
      : variant === "secondary"
        ? "border border-border bg-secondary text-secondary-text hover:bg-secondary-hover"
        : "border border-border bg-card text-text-primary hover:border-primary";

  return (
    <Link to={href} className={`${base} ${styles} ${className}`}>
      {children}
    </Link>
  );
}

export default function MarketingPage() {
  const location = useLocation();
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const ctas = resolveMarketingCtas(user);

  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.replace("#", "");
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [location.hash]);

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Navbar />

      {/* Hero — overflow isolated so sticky nav stays reliable */}
      <header className="relative border-b border-border overflow-x-clip">
        <div
          className={
            isDarkMode
              ? "absolute inset-0 bg-[radial-gradient(900px_420px_at_50%_-10%,rgba(10,107,110,0.35),transparent_60%)]"
              : "absolute inset-0 bg-[radial-gradient(900px_420px_at_50%_-10%,rgba(8,84,86,0.14),transparent_60%)]"
          }
          aria-hidden
        />
        <div className="relative max-w-[1100px] mx-auto px-4 sm:px-6 pt-12 pb-14 sm:pt-16 sm:pb-20 md:pt-20 md:pb-24">
          <p className="m-0 mb-3 sm:mb-4 text-xs sm:text-sm font-semibold tracking-wide text-primary">
            Adal AI
          </p>
          <h1 className="m-0 max-w-3xl text-[1.75rem] leading-tight sm:text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary">
            Legal marketplace and practice tools in one platform
          </h1>
          <p className="m-0 mt-4 sm:mt-5 max-w-xl text-base sm:text-lg text-text-secondary leading-relaxed">
            Clients find verified lawyers and book consultations. Lawyers run cases, AI research,
            documents, and firms—with Free, Pro, and Firm plans on each workspace.
          </p>

          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row sm:flex-wrap gap-3">
            <CtaLink href={ctas.clientPrimary.href}>
              {ctas.clientPrimary.label}
              <FiArrowRight className="h-4 w-4 shrink-0" />
            </CtaLink>
            <CtaLink href={ctas.lawyerPrimary.href} variant="outline">
              {ctas.lawyerPrimary.label}
            </CtaLink>
            <Link
              to="/pricing"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-1 px-2 py-3 text-sm font-semibold text-link no-underline hover:underline min-h-[44px]"
            >
              View pricing
              <FiArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row sm:flex-wrap gap-x-5 gap-y-2 text-sm text-text-secondary">
            {["Verified lawyers", "Workspace billing", "AI research & RAG"].map((chip) => (
              <span key={chip} className="inline-flex items-center gap-2">
                <FiCheck className="h-4 w-4 text-success shrink-0" />
                {chip}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* Dual audience */}
      <section
        id="features"
        className="scroll-mt-20 border-b border-border py-12 sm:py-16 md:py-20 px-4 sm:px-6"
      >
        <div className="max-w-[1100px] mx-auto">
          <SectionHeader
            eyebrow="Who it is for"
            title="Two products. One platform."
            subtitle="Whether you need counsel or run a practice, everything stays in one account model—with clear paths for each side."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-7 md:p-8 flex flex-col">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light text-primary mb-4">
                <FiUser className="h-5 w-5" />
              </span>
              <h3 className="m-0 text-lg sm:text-xl font-bold text-text-primary">For clients</h3>
              <p className="m-0 mt-2 text-sm text-text-secondary leading-relaxed flex-1">
                Search verified lawyers, book CHAT or VIDEO sessions, pay with wallet credits, chat
                in-session, leave reviews, and open disputes when needed—no subscription.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-2">
                <CtaLink href={ctas.clientPrimary.href}>
                  {ctas.clientPrimary.label}
                  <FiArrowRight className="h-4 w-4 shrink-0" />
                </CtaLink>
                <CtaLink href={ctas.clientSecondary.href} variant="outline">
                  {ctas.clientSecondary.label}
                </CtaLink>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-7 md:p-8 flex flex-col">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light text-primary mb-4">
                <FiBriefcase className="h-5 w-5" />
              </span>
              <h3 className="m-0 text-lg sm:text-xl font-bold text-text-primary">
                For lawyers & firms
              </h3>
              <p className="m-0 mt-2 text-sm text-text-secondary leading-relaxed flex-1">
                Marketplace profile and bookings stay available. Practice tools—cases, AI, documents,
                planner, and firm seats—are gated by your active workspace plan.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-2">
                <CtaLink href={ctas.lawyerPrimary.href}>
                  {ctas.lawyerPrimary.label}
                  <FiArrowRight className="h-4 w-4 shrink-0" />
                </CtaLink>
                <CtaLink href={ctas.lawyerSecondary.href} variant="outline">
                  {ctas.lawyerSecondary.label}
                </CtaLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marketplace */}
      <section
        id="marketplace"
        className="scroll-mt-20 border-b border-border py-12 sm:py-16 md:py-20 px-4 sm:px-6"
      >
        <div className="max-w-[1100px] mx-auto">
          <SectionHeader
            eyebrow="Marketplace"
            title="Hire and engage with confidence"
            subtitle="Everything clients need to find counsel and complete consultations—built into the same product lawyers use to get booked."
          />
          <FeatureGrid items={MARKETPLACE_FEATURES} />
        </div>
      </section>

      {/* Practice */}
      <section
        id="practice"
        className="scroll-mt-20 border-b border-border bg-surface py-12 sm:py-16 md:py-20 px-4 sm:px-6"
      >
        <div className="max-w-[1100px] mx-auto">
          <SectionHeader
            eyebrow="Practice tools"
            title="Run your practice in the active workspace"
            subtitle="Marketplace bookings stay open on every plan. Cases, documents, planner, and related tools unlock according to Free, Pro, or Firm entitlements."
          />
          <FeatureGrid items={PRACTICE_FEATURES} />
        </div>
      </section>

      {/* AI */}
      <section
        id="ai"
        className="scroll-mt-20 border-b border-border py-12 sm:py-16 md:py-20 px-4 sm:px-6"
      >
        <div className="max-w-[1100px] mx-auto">
          <SectionHeader
            eyebrow="AI & knowledge"
            title="Research and prep with grounded answers"
            subtitle="Assistants retrieve from shared case law and your private documents. Usage counts against your workspace plan."
          />
          <FeatureGrid items={AI_FEATURES} />
        </div>
      </section>

      {/* Firms */}
      <section
        id="firms"
        className="scroll-mt-20 border-b border-border bg-surface py-12 sm:py-16 md:py-20 px-4 sm:px-6"
      >
        <div className="max-w-[1100px] mx-auto">
          <SectionHeader
            eyebrow="Workspaces & firms"
            title="Solo today. Team when you are ready."
            subtitle="Personal and firm workspaces share the same model. Switch context, invite colleagues, and inherit the active workspace plan."
          />
          <FeatureGrid items={FIRM_FEATURES} />
        </div>
      </section>

      {/* Plans teaser */}
      <section
        id="pricing-teaser"
        className="scroll-mt-20 border-b border-border py-12 sm:py-16 md:py-20 px-4 sm:px-6"
      >
        <div className="max-w-[1100px] mx-auto">
          <SectionHeader
            eyebrow="Plans"
            title="Practice tools billed per workspace"
            subtitle="Clients never need a subscription. Lawyers and firms choose Free, Pro, or Firm for cases, AI, documents, storage, and seats. Compare full limits on Pricing."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
            {PLAN_TEASERS.map((plan) => (
              <div
                key={plan.name}
                className="rounded-2xl border border-border bg-card p-5 sm:p-6 flex flex-col"
              >
                <h3 className="m-0 text-lg sm:text-xl font-bold text-text-primary">{plan.name}</h3>
                <p className="m-0 mt-2 text-sm text-text-secondary leading-relaxed flex-1">
                  {plan.line}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-6 sm:mt-8">
            <div className="flex flex-col sm:flex-row gap-3">
              <CtaLink href="/pricing">
                Compare Free, Pro & Firm
                <FiArrowRight className="h-4 w-4 shrink-0" />
              </CtaLink>
              <CtaLink href="/request-demo" variant="outline">
                Request a demo
              </CtaLink>
            </div>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section
        id="trust"
        className="scroll-mt-20 border-b border-border bg-surface py-12 sm:py-16 md:py-20 px-4 sm:px-6"
      >
        <div className="max-w-[1100px] mx-auto">
          <SectionHeader
            eyebrow="Trust"
            title="Built for accountable legal work"
            subtitle="Verification, secure accounts, and platform review tools keep the marketplace credible—without turning KYC into a product fee."
          />
          <FeatureGrid items={TRUST_POINTS} />
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="scroll-mt-20 border-b border-border py-12 sm:py-16 md:py-20 px-4 sm:px-6"
      >
        <div className="max-w-[1100px] mx-auto">
          <SectionHeader
            eyebrow="How it works"
            title="Clear steps for each side"
            subtitle="Same platform—different journeys."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
            <div>
              <h3 className="m-0 mb-4 sm:mb-5 text-base sm:text-lg font-semibold text-text-primary">
                Clients
              </h3>
              <ol className="m-0 p-0 list-none space-y-4">
                {CLIENT_STEPS.map((s) => (
                  <li key={s.step} className="flex gap-3 sm:gap-4">
                    <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-text text-sm font-bold">
                      {s.step}
                    </span>
                    <div className="min-w-0">
                      <p className="m-0 font-semibold text-text-primary text-sm sm:text-base">
                        {s.title}
                      </p>
                      <p className="m-0 mt-1 text-sm text-text-secondary">{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <h3 className="m-0 mb-4 sm:mb-5 text-base sm:text-lg font-semibold text-text-primary">
                Lawyers
              </h3>
              <ol className="m-0 p-0 list-none space-y-4">
                {LAWYER_STEPS.map((s) => (
                  <li key={s.step} className="flex gap-3 sm:gap-4">
                    <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-text text-sm font-bold">
                      {s.step}
                    </span>
                    <div className="min-w-0">
                      <p className="m-0 font-semibold text-text-primary text-sm sm:text-base">
                        {s.title}
                      </p>
                      <p className="m-0 mt-1 text-sm text-text-secondary">{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
        <div className="max-w-[1100px] mx-auto rounded-2xl border border-border bg-card px-4 py-10 sm:px-8 sm:py-12 md:px-12 text-center">
          <h2 className="m-0 text-2xl sm:text-3xl md:text-4xl font-bold text-text-primary">
            Ready to explore the full product?
          </h2>
          <p className="m-0 mx-auto mt-3 max-w-xl text-sm sm:text-base text-text-secondary">
            Create an account, browse lawyers, or open your practice dashboard. Pricing stays
            transparent for lawyers and firms—clients book without a plan.
          </p>
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center">
            <CtaLink href={ctas.finalPrimary.href}>
              {ctas.finalPrimary.label}
              <FiArrowRight className="h-4 w-4 shrink-0" />
            </CtaLink>
            <CtaLink href="/request-demo" variant="secondary">
              Request a demo
            </CtaLink>
            <CtaLink href="/pricing" variant="outline">
              View pricing
            </CtaLink>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
