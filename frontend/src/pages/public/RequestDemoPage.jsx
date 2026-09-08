import { useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiCheck } from "react-icons/fi";
import { Navbar } from "../../components/layout";
import Footer from "../../components/Footer";
import { Button, Input, Select, Textarea } from "../../components/ui";
import { useTheme } from "../../context/ThemeContext";
import { submitDemoRequest } from "../../services/demo.api";
import { getErrorMessage } from "../../utils/errorHandler";
import "./marketing/marketing-motion.css";

const INTEREST_OPTIONS = [
  { value: "demo", label: "Product demo" },
  { value: "setup", label: "Setup / onboarding" },
  { value: "pricing", label: "Pricing discussion" },
  { value: "other", label: "Other" }
];

const TEAM_SIZE_OPTIONS = [
  { value: "1", label: "Just me" },
  { value: "2-5", label: "2–5" },
  { value: "6-20", label: "6–20" },
  { value: "21+", label: "21+" }
];

const INITIAL = {
  fullName: "",
  email: "",
  company: "",
  phone: "",
  roleTitle: "",
  interest: "",
  teamSize: "",
  message: "",
  website: ""
};

export default function RequestDemoPage() {
  const { isDarkMode } = useTheme();
  const [form, setForm] = useState(INITIAL);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function validateClient() {
    const errors = {};
    if (!form.fullName.trim() || form.fullName.trim().length < 2) {
      errors.fullName = "Please enter your full name";
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = "Please enter a valid work email";
    }
    const phoneDigits = form.phone.replace(/\D/g, "");
    if (phoneDigits.length < 7) {
      errors.phone = "Please enter a phone number";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");
    if (!validateClient()) return;

    setSubmitting(true);
    try {
      await submitDemoRequest({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        company: form.company.trim(),
        phone: form.phone.trim(),
        roleTitle: form.roleTitle.trim(),
        interest: form.interest || "demo",
        teamSize: form.teamSize,
        message: form.message.trim(),
        source: "request-demo",
        website: form.website
      });
      setDone(true);
      setForm(INITIAL);
    } catch (err) {
      setSubmitError(getErrorMessage(err) || "Could not submit your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className={`min-h-screen relative text-text-primary flex flex-col ${
        isDarkMode ? "mkt-landing--dark bg-background" : "mkt-landing--light bg-background"
      }`}
    >
      <Navbar />

      <main className="flex-1">
        {/* Hero Header Section with Radial Gradient Background */}
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

          <div className="relative max-w-[720px] mx-auto px-4 sm:px-6 py-10 sm:py-14 text-center">
            <p className="text-xs sm:text-sm font-semibold text-primary m-0 mb-3 tracking-wide uppercase">
              Request a demo
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-text-primary m-0 leading-tight">
              See Adal AI for your practice
            </h1>
            <p className="text-base sm:text-lg text-text-secondary m-0 mt-3 leading-relaxed">
              Share your name, email, and phone. Everything else is optional—we&apos;ll follow up
              to schedule a demo or help with setup.
            </p>
          </div>
        </header>

        {/* Form Body Container */}
        <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {done ? (
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
                <FiCheck className="h-6 w-6" aria-hidden />
              </div>
              <h2 className="m-0 text-xl sm:text-2xl font-bold text-text-primary">
                Request received
              </h2>
              <p className="m-0 mt-3 text-sm sm:text-base text-text-secondary leading-relaxed">
                Thanks for reaching out. Our team will contact you shortly at the email you
                provided—usually within one business day.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/"
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold no-underline bg-primary text-primary-text hover:bg-primary-hover min-h-[44px]"
                >
                  Back to home
                </Link>
                <button
                  type="button"
                  onClick={() => setDone(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold border border-border bg-secondary text-secondary-text hover:bg-secondary-hover min-h-[44px]"
                >
                  Submit another request
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="relative rounded-2xl border border-border bg-card p-5 sm:p-8 shadow-sm"
              noValidate
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                <Input
                  label="Full name *"
                  name="fullName"
                  autoComplete="name"
                  value={form.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  error={fieldErrors.fullName}
                  placeholder="Ayesha Khan"
                />
                <Input
                  label="Work email *"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  error={fieldErrors.email}
                  placeholder="you@firm.com"
                />
              </div>

              <Input
                label="Phone *"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                error={fieldErrors.phone}
                placeholder="+92 …"
              />

              <p className="m-0 mb-3 mt-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
                Optional details
              </p>

              <Input
                label="Company / firm"
                name="company"
                autoComplete="organization"
                value={form.company}
                onChange={(e) => update("company", e.target.value)}
                error={fieldErrors.company}
                placeholder="Khan & Associates"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                <Input
                  label="Your role"
                  name="roleTitle"
                  autoComplete="organization-title"
                  value={form.roleTitle}
                  onChange={(e) => update("roleTitle", e.target.value)}
                  placeholder="Managing partner, Ops, …"
                />
                <Select
                  label="Team size"
                  name="teamSize"
                  options={TEAM_SIZE_OPTIONS}
                  value={form.teamSize}
                  onChange={(e) => update("teamSize", e.target.value)}
                  placeholder="Optional"
                />
              </div>

              <Select
                label="What do you need?"
                name="interest"
                options={INTEREST_OPTIONS}
                value={form.interest}
                onChange={(e) => update("interest", e.target.value)}
                error={fieldErrors.interest}
                placeholder="Product demo (default)"
              />

              <Textarea
                label="Anything else we should know?"
                name="message"
                rows={4}
                value={form.message}
                onChange={(e) => update("message", e.target.value)}
                placeholder="Goals, timeline, number of lawyers, current tools…"
                helperText="Optional — max 2000 characters"
              />

              {/* Honeypot — hidden from humans */}
              <div className="absolute -left-[9999px] opacity-0 h-0 w-0 overflow-hidden" aria-hidden="true">
                <label htmlFor="website">Website</label>
                <input
                  id="website"
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.website}
                  onChange={(e) => update("website", e.target.value)}
                />
              </div>

              {submitError ? (
                <p className="mb-4 text-sm text-danger" role="alert">
                  {submitError}
                </p>
              ) : null}

              <p className="m-0 mb-5 text-xs text-text-muted leading-relaxed">
                We&apos;ll use these details only to contact you about Adal AI demos and setup.
                By submitting, you agree to be contacted by our team.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <Button
                  type="submit"
                  loading={submitting}
                  fullWidth
                  className="sm:w-auto sm:min-w-[180px]"
                  iconRight={FiArrowRight}
                >
                  Submit request
                </Button>
                <Link
                  to="/pricing"
                  className="inline-flex items-center justify-center text-sm font-semibold text-link no-underline hover:underline min-h-[44px]"
                >
                  Or view pricing
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}