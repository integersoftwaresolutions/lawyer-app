import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Navbar } from "../../components/layout";
import { useTheme } from "../../context/ThemeContext";

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
          <div className="py-20 px-6 text-center max-w-[1200px] mx-auto">
            <h1 className="text-5xl font-bold mb-4 text-text-primary">
              Lawyer Marketplace
            </h1>
            <p className="text-xl text-text-secondary mb-8 max-w-[600px] mx-auto">
              Connect with experienced lawyers for all your legal needs.
              Find the right legal professional, book consultations, and get expert advice.
            </p>
            <div className="flex gap-4 justify-center mb-16">
              <Link
                to="/register"
                className="py-4 px-8 rounded bg-primary text-primary-text cursor-pointer font-medium no-underline inline-block hover:bg-primary-hover transition-colors"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="py-4 px-8 rounded border border-border bg-secondary text-secondary-text cursor-pointer font-medium no-underline inline-block hover:bg-secondary-hover transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-6 max-w-[1200px] mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12 text-text-primary">
          Everything you need to hire with confidence
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6">
          <div className="border border-border rounded-xl bg-card p-6 text-left">
            <div className="text-base font-bold mb-2 text-text-primary">
              Verified professionals
            </div>
            <div className="text-sm leading-relaxed text-text-secondary">
              Browse profiles, experience, and expertise to find the right match for your case.
            </div>
          </div>
          <div className="border border-border rounded-xl bg-card p-6 text-left">
            <div className="text-base font-bold mb-2 text-text-primary">
              Fast booking
            </div>
            <div className="text-sm leading-relaxed text-text-secondary">
              Book consultations quickly and manage appointments from your dashboard.
            </div>
          </div>
          <div className="border border-border rounded-xl bg-card p-6 text-left">
            <div className="text-base font-bold mb-2 text-text-primary">
              Secure communication
            </div>
            <div className="text-sm leading-relaxed text-text-secondary">
              Keep your conversations organized with messaging built for client-lawyer collaboration.
            </div>
          </div>
          <div className="border border-border rounded-xl bg-card p-6 text-left">
            <div className="text-base font-bold mb-2 text-text-primary">
              Transparent pricing
            </div>
            <div className="text-sm leading-relaxed text-text-secondary">
              Choose a plan that fits your needs with clear benefits and upgrades any time.
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="py-20 px-6 max-w-[1200px] mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12 text-text-primary">
          Choose Your Plan
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-8">
          <div className="border border-border rounded-lg bg-card p-8 text-center">
            <h3 className="text-2xl font-bold mb-2 text-text-primary">Basic</h3>
            <div className="text-4xl font-bold mb-4 text-text-primary">Free</div>
            <p className="text-base text-text-secondary mb-6">Perfect for getting started</p>
            <ul className="list-none p-0 m-0 mb-6">
              <li className="py-2 text-text-secondary">✓ Browse lawyers</li>
              <li className="py-2 text-text-secondary">✓ Book consultations</li>
              <li className="py-2 text-text-secondary">✓ Basic messaging</li>
            </ul>
            <Link
              to="/register"
              className="py-4 px-8 rounded border border-border bg-secondary text-secondary-text cursor-pointer font-medium no-underline inline-block hover:bg-secondary-hover transition-colors"
            >
              Start Free
            </Link>
          </div>

          <div className="border-2 border-primary rounded-lg bg-card p-8 text-center scale-105">
            <h3 className="text-2xl font-bold mb-2 text-text-primary">Professional</h3>
            <div className="text-4xl font-bold mb-4 text-text-primary">$29/mo</div>
            <p className="text-base text-text-secondary mb-6">For regular legal needs</p>
            <ul className="list-none p-0 m-0 mb-6">
              <li className="py-2 text-text-secondary">✓ Everything in Basic</li>
              <li className="py-2 text-text-secondary">✓ Unlimited messaging</li>
              <li className="py-2 text-text-secondary">✓ Priority support</li>
              <li className="py-2 text-text-secondary">✓ Document review</li>
            </ul>
            <Link
              to="/register"
              className="py-4 px-8 rounded bg-primary text-primary-text cursor-pointer font-medium no-underline inline-block hover:bg-primary-hover transition-colors"
            >
              Get Started
            </Link>
          </div>

          <div className="border border-border rounded-lg bg-card p-8 text-center">
            <h3 className="text-2xl font-bold mb-2 text-text-primary">Enterprise</h3>
            <div className="text-4xl font-bold mb-4 text-text-primary">$99/mo</div>
            <p className="text-base text-text-secondary mb-6">For businesses and teams</p>
            <ul className="list-none p-0 m-0 mb-6">
              <li className="py-2 text-text-secondary">✓ Everything in Professional</li>
              <li className="py-2 text-text-secondary">✓ Team collaboration</li>
              <li className="py-2 text-text-secondary">✓ Dedicated account manager</li>
              <li className="py-2 text-text-secondary">✓ Custom integrations</li>
            </ul>
            <Link
              to="/register"
              className="py-4 px-8 rounded border border-border bg-secondary text-secondary-text cursor-pointer font-medium no-underline inline-block hover:bg-secondary-hover transition-colors"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div id="testimonials" className="bg-surface py-20 px-6">
        <h2 className="text-4xl font-bold text-center mb-12 text-text-primary">
          What Our Users Say
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-8 max-w-[1200px] mx-auto">
          <div className="border border-border rounded-lg bg-card p-6">
            <p className="text-base italic mb-4 text-text-secondary">
              "Lawyer Marketplace made it so easy to find the right lawyer for my case. 
              The platform is intuitive and the lawyers are highly qualified."
            </p>
            <div className="font-bold text-text-primary">- Sarah Johnson</div>
          </div>

          <div className="border border-border rounded-lg bg-card p-6">
            <p className="text-base italic mb-4 text-text-secondary">
              "As a lawyer, this platform has helped me connect with clients who need my expertise. 
              It's streamlined my entire client acquisition process."
            </p>
            <div className="font-bold text-text-primary">- Michael Chen</div>
          </div>

          <div className="border border-border rounded-lg bg-card p-6">
            <p className="text-base italic mb-4 text-text-secondary">
              "The booking system is seamless and the quality of lawyers is exceptional. 
              I found the perfect legal counsel for my business needs."
            </p>
            <div className="font-bold text-text-primary">- Emily Rodriguez</div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 px-6 bg-surface border-t border-b border-border">
        <div className="max-w-[1200px] mx-auto border border-border rounded-2xl bg-card p-10 text-center">
          <h2 className="text-3xl font-bold mb-3 text-text-primary">
            Ready to find the right lawyer?
          </h2>
          <p className="text-base mx-auto mb-6 max-w-[680px] text-text-secondary">
            Create your account in minutes and start browsing trusted legal professionals.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/register"
              className="py-4 px-8 rounded bg-primary text-primary-text cursor-pointer font-medium no-underline inline-block hover:bg-primary-hover transition-colors"
            >
              Create Account
            </Link>
            <Link
              to="/login"
              className="py-4 px-8 rounded border border-border bg-secondary text-secondary-text cursor-pointer font-medium no-underline inline-block hover:bg-secondary-hover transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-12 px-6 text-center border-t border-border text-text-secondary">
        <p>&copy; 2024 Lawyer Marketplace. All rights reserved.</p>
      </div>
    </div>
  );
}
