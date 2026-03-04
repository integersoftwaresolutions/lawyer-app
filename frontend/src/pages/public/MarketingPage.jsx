import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Navbar } from "../../components/layout";
import Footer from "../../components/Footer";
import { useTheme } from "../../context/ThemeContext";
import { 
  FiShield, 
  FiClock, 
  FiMessageCircle, 
  FiDollarSign,
  FiCheck,
  FiStar,
  FiArrowRight
} from "react-icons/fi";

export default function MarketingPage() {
  const location = useLocation();
  const { isDarkMode } = useTheme();

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
      {/* Hero Section */}
      <div className="border-b border-border">
        <div
          className={
            isDarkMode
              ? "bg-[radial-gradient(1000px_400px_at_50%_0%,rgba(255,255,255,0.12),transparent_55%)]"
              : "bg-[radial-gradient(1000px_400px_at_50%_0%,rgba(0,0,0,0.06),transparent_55%)]"
          }
        >
          <div className="py-24 px-6 text-center max-w-[1200px] mx-auto">
            <div className="mb-6">
              <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                Trusted by 10,000+ users
              </span>
            </div>
            <h1 className="text-6xl md:text-7xl font-bold mb-6 text-text-primary leading-tight">
              Find Your Perfect
              <span className="block text-primary">Legal Expert</span>
            </h1>
            <p className="text-xl md:text-2xl text-text-secondary mb-10 max-w-[700px] mx-auto leading-relaxed">
              Connect with verified lawyers, book consultations instantly, and get expert legal advice tailored to your needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link
                to="/register"
                className="py-4 px-8 rounded-lg bg-primary text-primary-text cursor-pointer font-semibold no-underline inline-flex items-center justify-center gap-2 hover:bg-primary-hover transition-all shadow-lg hover:shadow-xl"
              >
                Get Started Free
                <FiArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="py-4 px-8 rounded-lg border-2 border-border bg-secondary text-secondary-text cursor-pointer font-semibold no-underline inline-flex items-center justify-center hover:bg-secondary-hover transition-all"
              >
                Sign In
              </Link>
            </div>
            <div className="flex flex-wrap justify-center gap-8 text-sm text-text-secondary">
              <div className="flex items-center gap-2">
                <FiCheck className="w-5 h-5 text-success" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <FiCheck className="w-5 h-5 text-success" />
                <span>Free trial available</span>
              </div>
              <div className="flex items-center gap-2">
                <FiCheck className="w-5 h-5 text-success" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 px-6 max-w-[1200px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-text-primary">
            Everything you need to hire with confidence
          </h2>
          <p className="text-lg text-text-secondary max-w-[600px] mx-auto">
            Powerful features designed to make finding and working with lawyers seamless
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="border border-border rounded-xl bg-card p-8 text-left hover:shadow-lg transition-all hover:border-primary">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
              <FiShield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-3 text-text-primary">
              Verified Professionals
            </h3>
            <p className="text-sm leading-relaxed text-text-secondary">
              All lawyers are verified with proper credentials and bar council registration for your peace of mind.
            </p>
          </div>
          <div className="border border-border rounded-xl bg-card p-8 text-left hover:shadow-lg transition-all hover:border-primary">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
              <FiClock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-3 text-text-primary">
              Fast Booking
            </h3>
            <p className="text-sm leading-relaxed text-text-secondary">
              Book consultations in minutes. View availability, select time slots, and confirm instantly.
            </p>
          </div>
          <div className="border border-border rounded-xl bg-card p-8 text-left hover:shadow-lg transition-all hover:border-primary">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
              <FiMessageCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-3 text-text-primary">
              Secure Communication
            </h3>
            <p className="text-sm leading-relaxed text-text-secondary">
              End-to-end encrypted messaging and video calls. Your conversations stay private and secure.
            </p>
          </div>
          <div className="border border-border rounded-xl bg-card p-8 text-left hover:shadow-lg transition-all hover:border-primary">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
              <FiDollarSign className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-3 text-text-primary">
              Transparent Pricing
            </h3>
            <p className="text-sm leading-relaxed text-text-secondary">
              Clear, upfront pricing with no hidden fees. See rates before booking and pay securely.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="py-24 px-6 max-w-[1200px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-text-primary">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-text-secondary max-w-[600px] mx-auto">
            Choose the plan that works best for you. All plans include access to our verified lawyer network.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="border border-border rounded-2xl bg-card p-8 text-center hover:shadow-lg transition-all">
            <h3 className="text-2xl font-bold mb-2 text-text-primary">Basic</h3>
            <div className="mb-2">
              <span className="text-5xl font-bold text-text-primary">Free</span>
            </div>
            <p className="text-base text-text-secondary mb-8">Perfect for getting started</p>
            <ul className="list-none p-0 m-0 mb-8 text-left space-y-3">
              <li className="flex items-center gap-2 text-text-secondary">
                <FiCheck className="w-5 h-5 text-success flex-shrink-0" />
                <span>Browse verified lawyers</span>
              </li>
              <li className="flex items-center gap-2 text-text-secondary">
                <FiCheck className="w-5 h-5 text-success flex-shrink-0" />
                <span>Book consultations</span>
              </li>
              <li className="flex items-center gap-2 text-text-secondary">
                <FiCheck className="w-5 h-5 text-success flex-shrink-0" />
                <span>Basic messaging</span>
              </li>
              <li className="flex items-center gap-2 text-text-secondary">
                <FiCheck className="w-5 h-5 text-success flex-shrink-0" />
                <span>Profile reviews</span>
              </li>
            </ul>
            <Link
              to="/register"
              className="py-3 px-6 rounded-lg border-2 border-border bg-secondary text-secondary-text cursor-pointer font-semibold no-underline inline-block hover:bg-secondary-hover transition-all w-full"
            >
              Start Free
            </Link>
          </div>

          <div className="border-2 border-primary rounded-2xl bg-card p-8 text-center relative hover:shadow-xl transition-all scale-105">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-text text-xs font-semibold">
              Most Popular
            </div>
            <h3 className="text-2xl font-bold mb-2 text-text-primary">Professional</h3>
            <div className="mb-2">
              <span className="text-5xl font-bold text-text-primary">$29</span>
              <span className="text-text-secondary">/mo</span>
            </div>
            <p className="text-base text-text-secondary mb-8">For regular legal needs</p>
            <ul className="list-none p-0 m-0 mb-8 text-left space-y-3">
              <li className="flex items-center gap-2 text-text-secondary">
                <FiCheck className="w-5 h-5 text-success flex-shrink-0" />
                <span>Everything in Basic</span>
              </li>
              <li className="flex items-center gap-2 text-text-secondary">
                <FiCheck className="w-5 h-5 text-success flex-shrink-0" />
                <span>Unlimited messaging</span>
              </li>
              <li className="flex items-center gap-2 text-text-secondary">
                <FiCheck className="w-5 h-5 text-success flex-shrink-0" />
                <span>Priority support</span>
              </li>
              <li className="flex items-center gap-2 text-text-secondary">
                <FiCheck className="w-5 h-5 text-success flex-shrink-0" />
                <span>Document review</span>
              </li>
              <li className="flex items-center gap-2 text-text-secondary">
                <FiCheck className="w-5 h-5 text-success flex-shrink-0" />
                <span>Advanced search filters</span>
              </li>
            </ul>
            <Link
              to="/register"
              className="py-3 px-6 rounded-lg bg-primary text-primary-text cursor-pointer font-semibold no-underline inline-block hover:bg-primary-hover transition-all w-full shadow-lg"
            >
              Get Started
            </Link>
          </div>

          <div className="border border-border rounded-2xl bg-card p-8 text-center hover:shadow-lg transition-all">
            <h3 className="text-2xl font-bold mb-2 text-text-primary">Enterprise</h3>
            <div className="mb-2">
              <span className="text-5xl font-bold text-text-primary">$99</span>
              <span className="text-text-secondary">/mo</span>
            </div>
            <p className="text-base text-text-secondary mb-8">For businesses and teams</p>
            <ul className="list-none p-0 m-0 mb-8 text-left space-y-3">
              <li className="flex items-center gap-2 text-text-secondary">
                <FiCheck className="w-5 h-5 text-success flex-shrink-0" />
                <span>Everything in Professional</span>
              </li>
              <li className="flex items-center gap-2 text-text-secondary">
                <FiCheck className="w-5 h-5 text-success flex-shrink-0" />
                <span>Team collaboration</span>
              </li>
              <li className="flex items-center gap-2 text-text-secondary">
                <FiCheck className="w-5 h-5 text-success flex-shrink-0" />
                <span>Dedicated account manager</span>
              </li>
              <li className="flex items-center gap-2 text-text-secondary">
                <FiCheck className="w-5 h-5 text-success flex-shrink-0" />
                <span>Custom integrations</span>
              </li>
              <li className="flex items-center gap-2 text-text-secondary">
                <FiCheck className="w-5 h-5 text-success flex-shrink-0" />
                <span>API access</span>
              </li>
            </ul>
            <Link
              to="/register"
              className="py-3 px-6 rounded-lg border-2 border-border bg-secondary text-secondary-text cursor-pointer font-semibold no-underline inline-block hover:bg-secondary-hover transition-all w-full"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div id="testimonials" className="bg-surface py-24 px-6 border-t border-border">
        <div className="text-center mb-16 max-w-[1200px] mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-text-primary">
            Trusted by Thousands
          </h2>
          <p className="text-lg text-text-secondary max-w-[600px] mx-auto">
            See what our users have to say about their experience
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[1200px] mx-auto">
          <div className="border border-border rounded-xl bg-card p-8 hover:shadow-lg transition-all">
            <div className="flex gap-1 mb-4 text-warning">
              {[...Array(5)].map((_, i) => (
                <FiStar key={i} className="w-5 h-5 fill-current" />
              ))}
            </div>
            <p className="text-base leading-relaxed mb-6 text-text-secondary">
              "Lawyer Marketplace made it so easy to find the right lawyer for my case. 
              The platform is intuitive and the lawyers are highly qualified. I couldn't be happier with the service."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                SJ
              </div>
              <div>
                <div className="font-semibold text-text-primary">Sarah Johnson</div>
                <div className="text-sm text-text-secondary">Business Owner</div>
              </div>
            </div>
          </div>

          <div className="border border-border rounded-xl bg-card p-8 hover:shadow-lg transition-all">
            <div className="flex gap-1 mb-4 text-warning">
              {[...Array(5)].map((_, i) => (
                <FiStar key={i} className="w-5 h-5 fill-current" />
              ))}
            </div>
            <p className="text-base leading-relaxed mb-6 text-text-secondary">
              "As a lawyer, this platform has helped me connect with clients who need my expertise. 
              It's streamlined my entire client acquisition process and increased my bookings significantly."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                MC
              </div>
              <div>
                <div className="font-semibold text-text-primary">Michael Chen</div>
                <div className="text-sm text-text-secondary">Criminal Defense Lawyer</div>
              </div>
            </div>
          </div>

          <div className="border border-border rounded-xl bg-card p-8 hover:shadow-lg transition-all">
            <div className="flex gap-1 mb-4 text-warning">
              {[...Array(5)].map((_, i) => (
                <FiStar key={i} className="w-5 h-5 fill-current" />
              ))}
            </div>
            <p className="text-base leading-relaxed mb-6 text-text-secondary">
              "The booking system is seamless and the quality of lawyers is exceptional. 
              I found the perfect legal counsel for my business needs in just a few clicks."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                ER
              </div>
              <div>
                <div className="font-semibold text-text-primary">Emily Rodriguez</div>
                <div className="text-sm text-text-secondary">Startup Founder</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 px-6 bg-gradient-to-b from-surface to-background border-t border-border">
        <div className="max-w-[1200px] mx-auto border border-border rounded-2xl bg-card p-12 text-center shadow-xl">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-text-primary">
            Ready to find the right lawyer?
          </h2>
          <p className="text-xl mx-auto mb-8 max-w-[680px] text-text-secondary">
            Join thousands of satisfied clients and lawyers. Create your account in minutes and start your legal journey today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="py-4 px-8 rounded-lg bg-primary text-primary-text cursor-pointer font-semibold no-underline inline-flex items-center justify-center gap-2 hover:bg-primary-hover transition-all shadow-lg hover:shadow-xl"
            >
              Create Free Account
              <FiArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="py-4 px-8 rounded-lg border-2 border-border bg-secondary text-secondary-text cursor-pointer font-semibold no-underline inline-flex items-center justify-center hover:bg-secondary-hover transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
