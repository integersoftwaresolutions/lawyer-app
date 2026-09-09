import { useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiCheck } from "react-icons/fi";
import { Navbar } from "../../components/layout";
import Footer from "../../components/Footer";
import { Button, Input, Textarea } from "../../components/ui";
import { useTheme } from "../../context/ThemeContext";
import { submitFeatureRequest } from "../../services/feature.api";
import { getErrorMessage } from "../../utils/errorHandler";
import "./marketing/marketing-motion.css";

const INITIAL = {
  fullName: "",
  email: "",
  phone: "",
  feature: "",
  website: ""
};

export default function RequestFeaturePage() {
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
    if (form.feature.trim().length < 10 || form.feature.trim().length > 2000) {
      errors.feature = "Please describe your feature in 10 to 2000 characters";
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
      await submitFeatureRequest({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        feature: form.feature.trim(),
        source: "request-feature",
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
              Request a feature
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-text-primary m-0 leading-tight">
              Help shape Adal AI for your practice
            </h1>
            <p className="text-base sm:text-lg text-text-secondary m-0 mt-3 leading-relaxed">
              Share your name, email, phone, and the feature you would like us to build.
              Tell us how it would help your practice.
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
                Thanks for sharing your idea. Our team will review your feature request
                and may contact you at the email you provided for more details.
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
                  maxLength={120}
                  autoComplete="name"
                  value={form.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  error={fieldErrors.fullName}
                  placeholder="Ayesha Khan"
                />
                <Input
                  label="Work email *"
                  name="email"
                  maxLength={254}
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
                maxLength={40}
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                error={fieldErrors.phone}
                placeholder="+92 …"
              />

              <Textarea
                label="Describe your feature *"
                name="feature"
                rows={6}
                required
                minLength={10}
                maxLength={2000}
                value={form.feature}
                onChange={(e) => update("feature", e.target.value)}
                error={fieldErrors.feature}
                placeholder="What would you like Adal AI to do? Describe the problem and how your suggested feature would help."
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
                We&apos;ll use these details only to contact you about your feature request.
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