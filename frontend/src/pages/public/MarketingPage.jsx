import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { Navbar } from "../../components/layout";

export default function MarketingPage() {
  const { colors } = useTheme();
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.replace("#", "");
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [location.hash]);

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: colors.background,
      color: colors.text.primary
    },
    heroWrap: {
      borderBottom: `1px solid ${colors.border}`
    },
    hero: {
      padding: '80px 24px',
      textAlign: 'center',
      maxWidth: '1200px',
      margin: '0 auto'
    },
    title: {
      fontSize: '48px',
      fontWeight: 'bold',
      marginBottom: '16px',
      color: colors.text.primary
    },
    subtitle: {
      fontSize: '20px',
      color: colors.text.secondary,
      marginBottom: '32px',
      maxWidth: '600px',
      margin: '0 auto 32px'
    },
    buttonGroup: {
      display: 'flex',
      gap: '16px',
      justifyContent: 'center',
      marginBottom: '64px'
    },
    button: {
      padding: '16px 32px',
      borderRadius: '4px',
      border: 'none',
      backgroundColor: colors.button.primary,
      color: colors.button.primaryText,
      cursor: 'pointer',
      fontWeight: '500',
      textDecoration: 'none',
      display: 'inline-block'
    },
    secondaryButton: {
      padding: '16px 32px',
      borderRadius: '4px',
      border: `1px solid ${colors.border}`,
      backgroundColor: colors.button.secondary,
      color: colors.button.secondaryText,
      cursor: 'pointer',
      fontWeight: '500',
      textDecoration: 'none',
      display: 'inline-block'
    },
    section: {
      padding: '80px 24px',
      maxWidth: '1200px',
      margin: '0 auto'
    },
    featuresGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '24px'
    },
    featureCard: {
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      backgroundColor: colors.card,
      padding: '24px',
      textAlign: 'left'
    },
    featureTitle: {
      fontSize: '16px',
      fontWeight: 'bold',
      marginBottom: '8px',
      color: colors.text.primary
    },
    featureText: {
      fontSize: '14px',
      lineHeight: 1.6,
      color: colors.text.secondary
    },
    sectionTitle: {
      fontSize: '36px',
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: '48px',
      color: colors.text.primary
    },
    pricingGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '32px'
    },
    pricingCard: {
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      backgroundColor: colors.card,
      padding: '32px',
      textAlign: 'center'
    },
    pricingCardFeatured: {
      border: `2px solid ${colors.button.primary}`,
      transform: 'scale(1.05)'
    },
    planName: {
      fontSize: '24px',
      fontWeight: 'bold',
      marginBottom: '8px',
      color: colors.text.primary
    },
    planPrice: {
      fontSize: '36px',
      fontWeight: 'bold',
      marginBottom: '16px',
      color: colors.text.primary
    },
    planDescription: {
      fontSize: '16px',
      color: colors.text.secondary,
      marginBottom: '24px'
    },
    features: {
      listStyle: 'none',
      padding: 0,
      margin: '0 0 24px 0'
    },
    feature: {
      padding: '8px 0',
      color: colors.text.secondary
    },
    testimonials: {
      backgroundColor: colors.surface,
      padding: '80px 24px'
    },
    testimonialGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '32px',
      maxWidth: '1200px',
      margin: '0 auto'
    },
    testimonialCard: {
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      backgroundColor: colors.card,
      padding: '24px'
    },
    testimonialText: {
      fontSize: '16px',
      fontStyle: 'italic',
      marginBottom: '16px',
      color: colors.text.secondary
    },
    testimonialAuthor: {
      fontWeight: 'bold',
      color: colors.text.primary
    },
    ctaWrap: {
      padding: '80px 24px',
      backgroundColor: colors.surface,
      borderTop: `1px solid ${colors.border}`,
      borderBottom: `1px solid ${colors.border}`
    },
    cta: {
      maxWidth: '1200px',
      margin: '0 auto',
      border: `1px solid ${colors.border}`,
      borderRadius: '16px',
      backgroundColor: colors.card,
      padding: '40px 24px',
      textAlign: 'center'
    },
    ctaTitle: {
      fontSize: '28px',
      fontWeight: 'bold',
      marginBottom: '12px',
      color: colors.text.primary
    },
    ctaSubtitle: {
      fontSize: '16px',
      margin: '0 auto 24px',
      maxWidth: '680px',
      color: colors.text.secondary
    },
    footer: {
      padding: '48px 24px',
      textAlign: 'center',
      borderTop: `1px solid ${colors.border}`,
      color: colors.text.secondary
    }
  };

  return (
    <div style={styles.container}>
      <Navbar />
      {/* Hero Section */}
      <div style={styles.heroWrap}>
        <div
          style={{
            background:
              colors.background === '#000000'
                ? 'radial-gradient(1000px 400px at 50% 0%, rgba(255,255,255,0.12), transparent 55%)'
                : 'radial-gradient(1000px 400px at 50% 0%, rgba(0,0,0,0.06), transparent 55%)'
          }}
        >
          <div style={styles.hero}>
            <h1 style={styles.title}>Lawyer Marketplace</h1>
            <p style={styles.subtitle}>
              Connect with experienced lawyers for all your legal needs.
              Find the right legal professional, book consultations, and get expert advice.
            </p>
            <div style={styles.buttonGroup}>
              <Link to="/register" style={styles.button}>
                Get Started
              </Link>
              <Link to="/login" style={styles.secondaryButton}>
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Everything you need to hire with confidence</h2>
        <div style={styles.featuresGrid}>
          <div style={styles.featureCard}>
            <div style={styles.featureTitle}>Verified professionals</div>
            <div style={styles.featureText}>
              Browse profiles, experience, and expertise to find the right match for your case.
            </div>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureTitle}>Fast booking</div>
            <div style={styles.featureText}>
              Book consultations quickly and manage appointments from your dashboard.
            </div>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureTitle}>Secure communication</div>
            <div style={styles.featureText}>
              Keep your conversations organized with messaging built for client-lawyer collaboration.
            </div>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureTitle}>Transparent pricing</div>
            <div style={styles.featureText}>
              Choose a plan that fits your needs with clear benefits and upgrades any time.
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" style={styles.section}>
        <h2 style={styles.sectionTitle}>Choose Your Plan</h2>
        <div style={styles.pricingGrid}>
          <div style={styles.pricingCard}>
            <h3 style={styles.planName}>Basic</h3>
            <div style={styles.planPrice}>Free</div>
            <p style={styles.planDescription}>Perfect for getting started</p>
            <ul style={styles.features}>
              <li style={styles.feature}>✓ Browse lawyers</li>
              <li style={styles.feature}>✓ Book consultations</li>
              <li style={styles.feature}>✓ Basic messaging</li>
            </ul>
            <Link to="/register" style={styles.secondaryButton}>
              Start Free
            </Link>
          </div>

          <div style={{ ...styles.pricingCard, ...styles.pricingCardFeatured }}>
            <h3 style={styles.planName}>Professional</h3>
            <div style={styles.planPrice}>$29/mo</div>
            <p style={styles.planDescription}>For regular legal needs</p>
            <ul style={styles.features}>
              <li style={styles.feature}>✓ Everything in Basic</li>
              <li style={styles.feature}>✓ Unlimited messaging</li>
              <li style={styles.feature}>✓ Priority support</li>
              <li style={styles.feature}>✓ Document review</li>
            </ul>
            <Link to="/register" style={styles.button}>
              Get Started
            </Link>
          </div>

          <div style={styles.pricingCard}>
            <h3 style={styles.planName}>Enterprise</h3>
            <div style={styles.planPrice}>$99/mo</div>
            <p style={styles.planDescription}>For businesses and teams</p>
            <ul style={styles.features}>
              <li style={styles.feature}>✓ Everything in Professional</li>
              <li style={styles.feature}>✓ Team collaboration</li>
              <li style={styles.feature}>✓ Dedicated account manager</li>
              <li style={styles.feature}>✓ Custom integrations</li>
            </ul>
            <Link to="/register" style={styles.secondaryButton}>
              Contact Sales
            </Link>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div id="testimonials" style={styles.testimonials}>
        <h2 style={styles.sectionTitle}>What Our Users Say</h2>
        <div style={styles.testimonialGrid}>
          <div style={styles.testimonialCard}>
            <p style={styles.testimonialText}>
              "Lawyer Marketplace made it so easy to find the right lawyer for my case. 
              The platform is intuitive and the lawyers are highly qualified."
            </p>
            <div style={styles.testimonialAuthor}>- Sarah Johnson</div>
          </div>

          <div style={styles.testimonialCard}>
            <p style={styles.testimonialText}>
              "As a lawyer, this platform has helped me connect with clients who need my expertise. 
              It's streamlined my entire client acquisition process."
            </p>
            <div style={styles.testimonialAuthor}>- Michael Chen</div>
          </div>

          <div style={styles.testimonialCard}>
            <p style={styles.testimonialText}>
              "The booking system is seamless and the quality of lawyers is exceptional. 
              I found the perfect legal counsel for my business needs."
            </p>
            <div style={styles.testimonialAuthor}>- Emily Rodriguez</div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div style={styles.ctaWrap}>
        <div style={styles.cta}>
          <h2 style={styles.ctaTitle}>Ready to find the right lawyer?</h2>
          <p style={styles.ctaSubtitle}>
            Create your account in minutes and start browsing trusted legal professionals.
          </p>
          <div style={{ ...styles.buttonGroup, marginBottom: 0 }}>
            <Link to="/register" style={styles.button}>
              Create Account
            </Link>
            <Link to="/login" style={styles.secondaryButton}>
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <p>&copy; 2024 Lawyer Marketplace. All rights reserved.</p>
      </div>
    </div>
  );
}
