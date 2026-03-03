import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { authApi } from "../../services/auth.api";
import { Input, Button } from "../../components/ui";
import AuthLayout, { AuthDivider, AuthLink, ErrorMessage, FormSection } from "./AuthLayout";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, refreshUser } = useAuth();
  
  const email = searchParams.get("email") || user?.email || "";
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate("/register");
    }
  }, [email, navigate]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(value);
    if (errors.code) {
      setErrors({ ...errors, code: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (code.length !== 6) {
      setErrors({ code: "Please enter a 6-digit code" });
      return;
    }
    
    setLoading(true);
    setErrors({});
    
    try {
      await authApi.verifyOtp(email, code);
      setSuccess(true);
      
      // Refresh user data to get updated verification status
      if (refreshUser) {
        try {
          await refreshUser();
        } catch (err) {
          console.error("Failed to refresh user:", err);
        }
      }
      
      // Redirect after 2 seconds
      setTimeout(() => {
        const redirectMap = {
          CLIENT: "/client/dashboard",
          LAWYER: "/lawyer/dashboard",
          ADMIN: "/admin/dashboard",
        };
        navigate(redirectMap[user?.role] || "/login");
      }, 2000);
    } catch (error) {
      const message = error.response?.data?.message || "Verification failed. Please try again.";
      setErrors({ submit: message, code: message.includes("code") || message.includes("Invalid") || message.includes("expired") ? message : null });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    
    setResendLoading(true);
    setErrors({});
    
    try {
      await authApi.resendOtp(email);
      setResendCooldown(60); // 60 second cooldown
      setErrors({ submit: "Verification code resent! Please check your email." });
    } catch (error) {
      const message = error.response?.data?.message || "Failed to resend code. Please try again.";
      setErrors({ submit: message });
    } finally {
      setResendLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout
        title="Email Verified!"
        subtitle="Your email has been successfully verified"
      >
        <div className="text-center py-8">
          <div className="text-6xl mb-4">✓</div>
          <p className="text-text-secondary mb-6">Redirecting you to your dashboard...</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Verify Your Email"
      subtitle={`We've sent a verification code to ${email}`}
      footer={
        <>
          Didn't receive the code?{" "}
          <AuthLink onClick={handleResend} disabled={resendCooldown > 0 || resendLoading}>
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
          </AuthLink>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <ErrorMessage message={errors.submit} />

        <FormSection>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Verification Code
            </label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="000000"
              value={code}
              onChange={handleChange}
              error={errors.code}
              className="text-center text-2xl tracking-widest font-mono"
              maxLength={6}
              autoFocus
            />
            <p className="text-xs text-text-secondary mt-2 text-center">
              Enter the 6-digit code sent to your email
            </p>
          </div>
        </FormSection>

        <Button
          type="submit"
          fullWidth
          loading={loading}
          disabled={loading || code.length !== 6}
        >
          Verify Email
        </Button>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || resendLoading}
            className="text-sm text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendLoading ? "Sending..." : resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend verification code"}
          </button>
        </div>

        <AuthDivider />

        <div className="text-center">
          <AuthLink onClick={() => navigate("/login")}>
            Back to Login
          </AuthLink>
        </div>
      </form>
    </AuthLayout>
  );
}

