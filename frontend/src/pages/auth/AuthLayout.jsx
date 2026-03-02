import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { Card } from "../../components/ui";

export default function AuthLayout({ 
  children, 
  title, 
  subtitle,
  showBackButton = false,
  onBack,
  footer
}) {
  const { colors } = useTheme();
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      backgroundColor: colors.background,
    }}>
      <div style={{ width: '100%', maxWidth: '540px' }}>
        {showBackButton && (
          <button
            onClick={handleBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '16px',
              padding: '8px 0',
              background: 'none',
              border: 'none',
              color: colors.text.secondary,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            ← Back
          </button>
        )}

        <Card style={{ padding: '32px' }}>
          {(title || subtitle) && (
            <div style={{ marginBottom: '28px', textAlign: 'center' }}>
              {title && (
                <h1 style={{
                  fontSize: '26px',
                  fontWeight: '600',
                  margin: '0 0 8px 0',
                  color: colors.text.primary,
                }}>
                  {title}
                </h1>
              )}
              {subtitle && (
                <p style={{
                  fontSize: '14px',
                  margin: 0,
                  color: colors.text.secondary,
                }}>
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {children}

          {footer && (
            <div style={{
              marginTop: '24px',
              paddingTop: '20px',
              borderTop: `1px solid ${colors.border}`,
              textAlign: 'center',
              fontSize: '14px',
              color: colors.text.secondary,
            }}>
              {footer}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export function AuthDivider({ text = "or" }) {
  const { colors } = useTheme();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      margin: '24px 0',
    }}>
      <div style={{ flex: 1, height: '1px', backgroundColor: colors.border }} />
      <span style={{ fontSize: '13px', color: colors.text.muted }}>{text}</span>
      <div style={{ flex: 1, height: '1px', backgroundColor: colors.border }} />
    </div>
  );
}

export function AuthLink({ children, onClick }) {
  const { colors } = useTheme();

  return (
    <span
      onClick={onClick}
      style={{
        color: colors.button.primary,
        cursor: 'pointer',
        fontWeight: '500',
      }}
    >
      {children}
    </span>
  );
}

export function FormSection({ title, children }) {
  const { colors } = useTheme();

  return (
    <div style={{ marginBottom: '20px' }}>
      {title && (
        <h3 style={{
          fontSize: '13px',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          color: colors.text.muted,
          margin: '0 0 12px 0',
        }}>
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

export function FormRow({ children }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '12px',
    }}>
      {children}
    </div>
  );
}

export function ErrorMessage({ message }) {
  if (!message) return null;

  return (
    <div style={{
      padding: '12px 16px',
      marginBottom: '16px',
      borderRadius: '6px',
      backgroundColor: 'rgba(220, 53, 69, 0.1)',
      border: '1px solid rgba(220, 53, 69, 0.3)',
      color: '#dc3545',
      fontSize: '13px',
    }}>
      {message}
    </div>
  );
}
