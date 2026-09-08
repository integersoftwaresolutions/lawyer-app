import { Link } from "react-router-dom";
import {
  FiMail,
  FiMapPin,
  FiTwitter,
  FiLinkedin,
  FiFacebook,
  FiGithub
} from "react-icons/fi";
import BrandLogo from "./BrandLogo";

const linkClass =
  "inline-flex items-center min-h-9 text-sm text-text-secondary hover:text-primary transition-colors";

const QUICK_LINKS = [
  { to: "/", label: "Home" },
  { to: "/lawyers", label: "Find Lawyers" },
  { to: "/pricing", label: "Pricing" },
  { to: "/request-demo", label: "Request a demo" },
  { to: "/#features", label: "Features" },
  { to: "/#marketplace", label: "Marketplace" },
  { to: "/#practice", label: "Practice tools" }
];

const LAWYER_LINKS = [
  { to: "/register?role=lawyer", label: "Join as Lawyer" },
  { to: "/pricing", label: "Base / Max / Firm" },
  { to: "/request-demo", label: "Request a demo" },
  { to: "/#how-it-works", label: "How it works" },
  { to: "/#ai", label: "AI & knowledge" },
  { to: "/#firms", label: "Firms & workspaces" }
];

function FooterColumn({ title, links }) {
  return (
    <div>
      <h4 className="text-xs sm:text-sm font-semibold mb-3 sm:mb-4 text-text-primary uppercase tracking-wide">
        {title}
      </h4>
      <ul className="space-y-1 sm:space-y-2">
        {links.map((item) => (
          <li key={`${item.to}-${item.label}`}>
            <Link to={item.to} className={linkClass}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-surface border-t border-border">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 sm:gap-x-8 gap-y-8 mb-8">
          <div className="col-span-2 lg:col-span-1">
            <div className="mb-3 sm:mb-4">
              <BrandLogo
                imgClassName="h-8 w-auto"
                wordmarkClassName="text-lg font-bold text-text-primary"
              />
            </div>
            <p className="text-sm text-text-secondary mb-4 leading-relaxed max-w-md">
              Legal practice management, simplified—cases, documents, teams, billing, and AI in one
              workspace. Clients can book verified lawyers on the same platform.
            </p>
            <div className="flex flex-wrap gap-2.5">
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center text-text-secondary hover:text-primary hover:border-primary transition-colors"
                aria-label="Twitter"
              >
                <FiTwitter className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center text-text-secondary hover:text-primary hover:border-primary transition-colors"
                aria-label="LinkedIn"
              >
                <FiLinkedin className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center text-text-secondary hover:text-primary hover:border-primary transition-colors"
                aria-label="Facebook"
              >
                <FiFacebook className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center text-text-secondary hover:text-primary hover:border-primary transition-colors"
                aria-label="GitHub"
              >
                <FiGithub className="w-4 h-4" />
              </a>
            </div>
          </div>

          <FooterColumn title="Quick Links" links={QUICK_LINKS} />
          <FooterColumn title="For Lawyers" links={LAWYER_LINKS} />

          <div className="col-span-2 lg:col-span-1">
            <h4 className="text-xs sm:text-sm font-semibold mb-3 sm:mb-4 text-text-primary uppercase tracking-wide">
              Contact
            </h4>
            <ul className="grid grid-cols-1 gap-3">
              <li className="flex items-center gap-2 min-h-9">
                <FiMail className="w-4 h-4 text-text-secondary flex-shrink-0" />
                <a
                  href="mailto:support@adal-ai.com"
                  className="text-sm text-text-secondary hover:text-primary transition-colors break-all"
                >
                  support@adal-ai.com
                </a>
              </li>             
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-6 sm:pt-8 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-sm text-text-secondary text-center md:text-left m-0">
            &copy; {currentYear} Adal AI. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1">
            <Link to="#" className={linkClass}>
              Privacy Policy
            </Link>
            <Link to="#" className={linkClass}>
              Terms of Service
            </Link>
            <Link to="#" className={linkClass}>
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
