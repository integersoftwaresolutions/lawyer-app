import { Link, useNavigate } from "react-router-dom";
import { Card } from "../../components/ui";
import BrandLogo from "../../components/BrandLogo";
import ThemeToggle from "../../components/ThemeToggle";

export default function AuthLayout({
  children,
  title,
  subtitle,
  showBackButton = false,
  onBack,
  footer
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-[540px]">
        <div className="mb-6 text-center">
          <BrandLogo
            className="justify-center"
            imgClassName="h-9 w-auto"
            wordmarkClassName="text-xl font-bold text-text-primary"
          />
          <p className="m-0 mt-1 text-xs text-text-muted">
            <Link to="/" className="text-text-muted no-underline hover:text-primary transition-colors">
              Back to home
            </Link>
          </p>
        </div>

        {showBackButton && (
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1.5 mb-4 py-2 bg-transparent border-none text-text-secondary text-sm cursor-pointer hover:text-text-primary transition-colors"
          >
            ← Back
          </button>
        )}

        <Card padding="p-8">
          {(title || subtitle) && (
            <div className="mb-7 text-center">
              {title && (
                <h1 className="text-[26px] font-semibold m-0 mb-2 text-text-primary">{title}</h1>
              )}
              {subtitle &&
                (typeof subtitle === "string" ? (
                  <p className="text-sm m-0 text-text-secondary">{subtitle}</p>
                ) : (
                  <div className="text-sm m-0 text-text-secondary">{subtitle}</div>
                ))}
            </div>
          )}

          {children}

          {footer && (
            <div className="mt-6 pt-5 border-t border-border text-center text-sm text-text-secondary">
              {footer}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export function AuthDivider({ text = "or" }) {
  return (
    <div className="flex items-center gap-4 my-6">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-text-muted">{text}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

export function AuthLink({ children, onClick }) {
  return (
    <span
      onClick={onClick}
      className="text-primary cursor-pointer font-medium hover:text-primary-hover transition-colors"
    >
      {children}
    </span>
  );
}

export function FormSection({ title, children }) {
  return (
    <div className="mb-5">
      {title && (
        <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted m-0 mb-3">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

export function FormRow({ children }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

export function ErrorMessage({ message }) {
  if (!message) return null;

  return (
    <div className="py-3 px-4 mb-4 rounded-md bg-danger-light border border-danger text-danger text-xs">
      {message}
    </div>
  );
}
