import { Link } from "react-router-dom";
import { 
  FiMail, 
  FiPhone, 
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
            <h3 className="text-lg font-bold mb-4 text-text-primary">Lawyer Marketplace</h3>
            <p className="text-sm text-text-secondary mb-4 leading-relaxed">
              Connect with experienced lawyers for all your legal needs. 
              Find the right legal professional and get expert advice.
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
                <Link to="/#pricing" className="text-sm text-text-secondary hover:text-primary transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/#testimonials" className="text-sm text-text-secondary hover:text-primary transition-colors">
                  Testimonials
                </Link>
              </li>
            </ul>
          </div>

          {/* For Lawyers */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-text-primary uppercase tracking-wide">For Lawyers</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/register" className="text-sm text-text-secondary hover:text-primary transition-colors">
                  Join as Lawyer
                </Link>
              </li>
              <li>
                <a href="#" className="text-sm text-text-secondary hover:text-primary transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-text-secondary hover:text-primary transition-colors">
                  Success Stories
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-text-secondary hover:text-primary transition-colors">
                  Resources
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-text-primary uppercase tracking-wide">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <FiMail className="w-4 h-4 text-text-secondary mt-0.5 flex-shrink-0" />
                <a href="mailto:support@lawyermarketplace.com" className="text-sm text-text-secondary hover:text-primary transition-colors">
                  support@lawyermarketplace.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <FiPhone className="w-4 h-4 text-text-secondary mt-0.5 flex-shrink-0" />
                <a href="tel:+1234567890" className="text-sm text-text-secondary hover:text-primary transition-colors">
                  +1 (234) 567-890
                </a>
              </li>
              <li className="flex items-start gap-2">
                <FiMapPin className="w-4 h-4 text-text-secondary mt-0.5 flex-shrink-0" />
                <span className="text-sm text-text-secondary">
                  123 Legal Street, Suite 100<br />
                  New York, NY 10001
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-text-secondary">
            &copy; {currentYear} Lawyer Marketplace. All rights reserved.
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

