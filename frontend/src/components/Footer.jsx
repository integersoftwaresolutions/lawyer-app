import { Link } from "react-router-dom";
import { 
  FiMail, 
  FiMapPin, 
  FiTwitter, 
  FiLinkedin, 
  FiFacebook,
  FiGithub
} from "react-icons/fi";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-surface border-t border-border">
      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-text-primary">Adal AI</h3>
            <p className="text-sm text-text-secondary mb-4 leading-relaxed">
              Marketplace for clients. Practice tools for lawyers and firms—cases, AI, documents,
              and workspace billing.
            </p>
            <div className="flex gap-3">
              <a 
                href="#" 
                className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center text-text-secondary hover:text-primary hover:border-primary transition-colors"
                aria-label="Twitter"
              >
                <FiTwitter className="w-4 h-4" />
              </a>
              <a 
                href="#" 
                className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center text-text-secondary hover:text-primary hover:border-primary transition-colors"
                aria-label="LinkedIn"
              >
                <FiLinkedin className="w-4 h-4" />
              </a>
              <a 
                href="#" 
                className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center text-text-secondary hover:text-primary hover:border-primary transition-colors"
                aria-label="Facebook"
              >
                <FiFacebook className="w-4 h-4" />
              </a>
              <a 
                href="#" 
                className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center text-text-secondary hover:text-primary hover:border-primary transition-colors"
                aria-label="GitHub"
              >
                <FiGithub className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-text-primary uppercase tracking-wide">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm text-text-secondary hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/lawyers" className="text-sm text-text-secondary hover:text-primary transition-colors">
                  Find Lawyers
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-sm text-text-secondary hover:text-primary transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/request-demo" className="text-sm text-text-secondary hover:text-primary transition-colors">
                  Request a demo
                </Link>
              </li>
              <li>
                <Link to="/#features" className="text-sm text-text-secondary hover:text-primary transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/#marketplace" className="text-sm text-text-secondary hover:text-primary transition-colors">
                  Marketplace
                </Link>
              </li>
              <li>
                <Link to="/#practice" className="text-sm text-text-secondary hover:text-primary transition-colors">
                  Practice tools
                </Link>
              </li>
            </ul>
          </div>

          {/* For Lawyers */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-text-primary uppercase tracking-wide">For Lawyers</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/register?role=lawyer" className="text-sm text-text-secondary hover:text-primary transition-colors">
                  Join as Lawyer
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-sm text-text-secondary hover:text-primary transition-colors">
                  Free / Pro / Firm
                </Link>
              </li>
              <li>
                <Link to="/request-demo" className="text-sm text-text-secondary hover:text-primary transition-colors">
                  Request a demo
                </Link>
              </li>
              <li>
                <Link to="/#how-it-works" className="text-sm text-text-secondary hover:text-primary transition-colors">
                  How it works
                </Link>
              </li>
              <li>
                <Link to="/#ai" className="text-sm text-text-secondary hover:text-primary transition-colors">
                  AI & knowledge
                </Link>
              </li>
              <li>
                <Link to="/#firms" className="text-sm text-text-secondary hover:text-primary transition-colors">
                  Firms & workspaces
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-text-primary uppercase tracking-wide">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <FiMail className="w-4 h-4 text-text-secondary mt-0.5 flex-shrink-0" />
                <a href="mailto:support@adal-ai.com" className="text-sm text-text-secondary hover:text-primary transition-colors">
                  support@adal-ai.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <FiMapPin className="w-4 h-4 text-text-secondary mt-0.5 flex-shrink-0" />
                <a
                  href="https://adal-ai.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-text-secondary hover:text-primary transition-colors"
                >
                  adal-ai.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-text-secondary">
            &copy; {currentYear} Adal AI. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link to="#" className="text-sm text-text-secondary hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link to="#" className="text-sm text-text-secondary hover:text-primary transition-colors">
              Terms of Service
            </Link>
            <Link to="#" className="text-sm text-text-secondary hover:text-primary transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

