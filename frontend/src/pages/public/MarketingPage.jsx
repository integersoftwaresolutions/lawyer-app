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
  CORE_PILLARS,
  FIRM_FEATURES,
  LAWYER_STEPS,
  MARKETPLACE_FEATURES,
  PLAN_TEASERS,
  PRACTICE_FEATURES,
  ROADMAP_POINTS,
  TRUST_POINTS
} from "./marketing/featureData";
import { FeatureGrid, SectionHeader } from "./marketing/SectionBits";
import Reveal, { RevealGroup } from "./marketing/Reveal";
import { SpotlightImage } from "./marketing/ThemeImage";
import "./marketing/marketing-motion.css";

function CtaLink({ href, children, variant = "primary", className = "" }) {
  const base =
    "mkt-btn inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold no-underline min-h-[44px]";
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
    <div
      className={`mkt-landing relative min-h-screen text-text-primary ${
        isDarkMode ? "mkt-landing--dark" : "mkt-landing--light"
      }`}
    >
      <Navbar />

      {/* Hero */}
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
        <div className="relative max-w-[1100px] mx-auto px-4 sm:px-6 pt-12 pb-14 sm:pt-16 sm:pb-20 md:pt-20 md:pb-24">
          <RevealGroup className="flex flex-col">
            <p className="reveal-item m-0 mb-3 sm:mb-4 text-xs sm:text-sm font-semibold tracking-wide text-primary">
              Adal AI
            </p>
            <h1 className="reveal-item m-0 max-w-3xl text-[1.75rem] leading-tight sm:text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary">
              Legal practice management, simplified
            </h1>
            <p className="reveal-item m-0 mt-4 sm:mt-5 max-w-2xl text-base sm:text-lg text-text-secondary leading-relaxed">
              Adal helps lawyers and law firms manage their work from one place—cases, documents,
              teams, billing, and AI in one legal workspace. Clients can still find verified lawyers
              and book consultations on the same platform.
            </p>

            <div className="reveal-item mt-6 sm:mt-8 flex flex-col sm:flex-row sm:flex-wrap gap-x-5 gap-y-2 text-sm text-text-secondary">
              {["Cases & documents", "Workspaces & roles", "AI & planner"].map((chip) => (
                <span key={chip} className="inline-flex items-center gap-2">
                  <FiCheck className="h-4 w-4 text-success shrink-0" />
                  {chip}
                </span>
              ))}
            </div>

            <div className="reveal-item mt-6 sm:mt-8 flex flex-col sm:flex-row sm:flex-wrap gap-3">
              <CtaLink href={ctas.lawyerPrimary.href}>
                {ctas.lawyerPrimary.label}
                <FiArrowRight className="h-4 w-4 shrink-0" />
              </CtaLink>
              <CtaLink href="/request-demo" variant="outline">
                Request a demo
              </CtaLink>
              <Link
                to="/pricing"
                className="mkt-btn inline-flex w-full sm:w-auto items-center justify-center gap-1 px-2 py-3 text-sm font-semibold text-link no-underline hover:underline min-h-[44px]"
              >
                View pricing
                <FiArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="reveal-item mt-8 sm:mt-10 md:mt-12">
              <SpotlightImage
                name="spotlight-workspace"
                alt="Adal workspace dashboard on a laptop"
                className="mkt-spotlight--hero"
                eager
              />
            </div>
          </RevealGroup>
        </div>
      </header>

      {/* Core pillars */}
      <section
        id="features"
        className="scroll-mt-20 border-b border-border py-12 sm:py-16 md:py-20 px-4 sm:px-6"
      >
        <div className="max-w-[1100px] mx-auto">
          <FeatureGrid
            header={
              <SectionHeader
                eyebrow="What Adal includes"
                title="Everything you need to run the practice"
                subtitle="The product promise in one place—manage legal work without juggling disconnected tools."
              />
            }
            items={CORE_PILLARS}
          />
        </div>
      </section>

      {/* Dual audience */}
      <section className="scroll-mt-20 border-b border-border mkt-band py-12 sm:py-16 md:py-20 px-4 sm:px-6">
        <div className="max-w-[1100px] mx-auto">
          <RevealGroup className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="reveal-item col-span-full">
              <SectionHeader
                eyebrow="Who it is for"
                title="Built for lawyers. Open to clients."
                subtitle="Practice management is the core. Marketplace bookings connect clients to the same lawyers who run their work in Adal."
              />
            </div>
            <div className="reveal-item h-full">
              <div className="mkt-card h-full rounded-2xl border border-border bg-card p-5 sm:p-7 md:p-8 flex flex-col">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light text-primary mb-4 animate-float-soft float-delay-1">
                  <FiBriefcase className="h-5 w-5" />
                </span>
                <h3 className="m-0 text-lg sm:text-xl font-bold text-text-primary">
                  For lawyers & firms
                </h3>
                <p className="m-0 mt-2 text-sm text-text-secondary leading-relaxed flex-1">
                  Cases, documents, workspaces, roles, planner, AI, billing, and bookings—gated by
                  your active workspace plan.
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
            <div className="reveal-item h-full">
              <div className="mkt-card h-full rounded-2xl border border-border bg-card p-5 sm:p-7 md:p-8 flex flex-col">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light text-primary mb-4 animate-float-soft float-delay-2">
                  <FiUser className="h-5 w-5" />
                </span>
                <h3 className="m-0 text-lg sm:text-xl font-bold text-text-primary">For clients</h3>
                <p className="m-0 mt-2 text-sm text-text-secondary leading-relaxed flex-1">
                  Search verified lawyers, book CHAT or VIDEO sessions, pay with wallet credits, and
                  follow up in-session—no subscription required.
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
            </div>
          </RevealGroup>
        </div>
      </section>

      {/* Practice deep-dive */}
      <section
        id="practice"
        className="scroll-mt-20 border-b border-border py-12 sm:py-16 md:py-20 px-4 sm:px-6"
      >
        <div className="max-w-[1100px] mx-auto space-y-8 sm:space-y-10">
          <Reveal className="mkt-split-visual">
            <div>
              <SectionHeader
                eyebrow="Cases & documents"
                title="Keep matters and files in one workspace"
                subtitle="Case management and document handling sit at the center of Adal—organized by the workspace you are working in."
              />
            </div>
            <SpotlightImage
              name="spotlight-practice"
              alt="Legal case files and documents organized for practice work"
            />
          </Reveal>
          <FeatureGrid columns="two" items={PRACTICE_FEATURES} />
        </div>
      </section>

      {/* Firms */}
      <section
        id="firms"
        className="scroll-mt-20 border-b border-border mkt-band py-12 sm:py-16 md:py-20 px-4 sm:px-6"
      >
        <div className="max-w-[1100px] mx-auto">
          <FeatureGrid
            columns="two"
            header={
              <SectionHeader
                eyebrow="Workspaces & teams"
                title="Personal today. Firm when you are ready."
                subtitle="Invite colleagues, assign roles, and share quotas—without losing the solo workflow you started with."
              />
            }
            items={FIRM_FEATURES}
          />
        </div>
      </section>

      {/* Marketplace / bookings */}
      <section
        id="marketplace"
        className="scroll-mt-20 border-b border-border py-12 sm:py-16 md:py-20 px-4 sm:px-6"
      >
        <div className="max-w-[1100px] mx-auto space-y-8 sm:space-y-10">
          <Reveal className="mkt-split-visual mkt-split-visual--flip">
            <div>
              <SectionHeader
                eyebrow="Bookings & marketplace"
                title="Get booked—and hire with confidence"
                subtitle="Lawyer bookings and KYC live alongside practice tools. Clients find counsel; lawyers manage availability and sessions."
              />
            </div>
            <SpotlightImage
              name="spotlight-marketplace"
              alt="Booking consultations on Adal marketplace"
            />
          </Reveal>
          <FeatureGrid items={MARKETPLACE_FEATURES} />
        </div>
      </section>

      {/* AI */}
      <section
        id="ai"
        className="scroll-mt-20 border-b border-border mkt-band py-12 sm:py-16 md:py-20 px-4 sm:px-6"
      >
        <div className="max-w-[1100px] mx-auto space-y-8 sm:space-y-10">
          <Reveal className="mkt-split-visual">
            <div>
              <SectionHeader
                eyebrow="AI & document intelligence"
                title="Assistants that work with your material"
                subtitle="Research and prep with answers grounded in shared case law and your private documents—usage follows your workspace plan."
              />
            </div>
            <SpotlightImage
              name="spotlight-ai"
              alt="AI-assisted legal research in Adal"
            />
          </Reveal>
          <FeatureGrid columns="two" items={AI_FEATURES} />
        </div>
      </section>

      {/* Plans */}
      <section
        id="pricing-teaser"
        className="scroll-mt-20 border-b border-border py-12 sm:py-16 md:py-20 px-4 sm:px-6"
      >
        <div className="max-w-[1100px] mx-auto">
          <RevealGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <div className="reveal-item col-span-full">
              <SectionHeader
                eyebrow="Billing & plans"
                title="Subscriptions that match the workspace"
                subtitle="Clients never need a subscription. Lawyers and firms choose Adal Base, Adal Max, or a Law Firm plan—self-serve checkout is coming soon."
              />
            </div>
            {PLAN_TEASERS.map((plan) => (
              <div key={plan.name} className="reveal-item h-full">
                <div className="mkt-card relative h-full overflow-hidden rounded-2xl border border-border bg-card p-5 sm:p-6 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="m-0 text-lg sm:text-xl font-bold text-text-primary">{plan.name}</h3>
                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-text-muted border border-border rounded-full px-2 py-0.5">
                      Soon
                    </span>
                  </div>
                  {plan.priceLabel ? (
                    <p className="m-0 mt-2 text-sm font-semibold text-primary">{plan.priceLabel}</p>
                  ) : null}
                  <p className="m-0 mt-2 text-sm text-text-secondary leading-relaxed flex-1">
                    {plan.line}
                  </p>
                  <div className="mkt-card-action mt-4">
                    <Link
                      to="/pricing"
                      className="mkt-btn inline-flex items-center gap-1 text-sm font-semibold text-primary no-underline"
                    >
                      View pricing
                      <FiArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
            <div className="reveal-item col-span-full mt-2 sm:mt-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <CtaLink href="/pricing">
                  View full pricing
                  <FiArrowRight className="h-4 w-4 shrink-0" />
                </CtaLink>
                <CtaLink href="/request-demo" variant="outline">
                  Request a demo
                </CtaLink>
              </div>
            </div>
          </RevealGroup>
        </div>
      </section>

      {/* Trust + notifications */}
      <section
        id="trust"
        className="scroll-mt-20 border-b border-border mkt-band py-12 sm:py-16 md:py-20 px-4 sm:px-6"
      >
        <div className="max-w-[1100px] mx-auto">
          <FeatureGrid
            header={
              <SectionHeader
                eyebrow="Trust & alerts"
                title="Accountable work. Clear notifications."
                subtitle="Verification and secure accounts keep the marketplace credible. In-app and email alerts keep the practice moving."
              />
            }
            items={TRUST_POINTS}
          />
        </div>
      </section>

      {/* Roadmap */}
      <section
        id="roadmap"
        className="scroll-mt-20 border-b border-border py-12 sm:py-16 md:py-20 px-4 sm:px-6"
      >
        <div className="max-w-[1100px] mx-auto">
          <FeatureGrid
            columns="two"
            header={
              <SectionHeader
                eyebrow="In progress"
                title="More is already on the way"
                subtitle="We are shipping deeper case-level AI and improved search and filtering—on top of the workspace you can use today."
              />
            }
            items={ROADMAP_POINTS}
          />
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="scroll-mt-20 border-b border-border mkt-band py-12 sm:py-16 md:py-20 px-4 sm:px-6"
      >
        <div className="max-w-[1100px] mx-auto">
          <RevealGroup className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
            <div className="reveal-item col-span-full">
              <SectionHeader
                eyebrow="How it works"
                title="Clear steps for each side"
                subtitle="Same platform—practice-first for lawyers, booking-first for clients."
              />
            </div>
            <div className="reveal-item">
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
            <div className="reveal-item">
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
          </RevealGroup>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
        <RevealGroup className="max-w-[1100px] mx-auto">
          <div className="reveal-item mkt-card rounded-2xl border border-border bg-card px-4 py-10 sm:px-8 sm:py-12 md:px-12 text-center">
            <h2 className="m-0 text-2xl sm:text-3xl md:text-4xl font-bold text-text-primary">
              Cases, documents, teams, billing, and AI—in one legal workspace
            </h2>
            <p className="m-0 mx-auto mt-3 max-w-xl text-sm sm:text-base text-text-secondary">
              Start free as a lawyer, request a demo for your firm, or find counsel as a client.
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
        </RevealGroup>
      </section>

      <Reveal className="border-t border-border">
        <Footer />
      </Reveal>
    </div>
  );
}
