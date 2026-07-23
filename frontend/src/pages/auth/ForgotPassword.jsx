import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiCheckCircle, FiMail } from "react-icons/fi";
import { useToast } from "../../hooks/useToast";
import { authApi } from "../../services/auth.api";
import { useAuth } from "../../hooks/useAuth";
import { Input, Button } from "../../components/ui";
import AuthLayout, { AuthDivider, AuthLink, ErrorMessage, FormSection } from "./AuthLayout";
import { OtpInput } from "./components/OtpInput";
import { ResendOtpButton } from "./components/ResendOtpButton";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const { logout, isAuthenticated } = useAuth();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      await authApi.forgotPassword(email);
      setStep(2);
      toast.success("If an account exists, a reset code has been sent to your email.");
    } catch (error) {
      const message = error.response?.data?.message || "Failed to send reset code";
      setErrors({ submit: message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (code.length !== 6) newErrors.code = "Enter the 6-digit code";
    if (!newPassword) newErrors.newPassword = "Password is required";
    else if (newPassword.length < 6) newErrors.newPassword = "Password must be at least 6 characters";
    if (newPassword !== confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      await authApi.resetPassword({ email, code, newPassword });
      if (isAuthenticated) {
        await logout();
      }
      setSuccess(true);
      toast.success("Password reset successfully!");
      setTimeout(() => navigate("/login"), 2500);
    } catch (error) {
      const message = error.response?.data?.message || "Failed to reset password";
      setErrors({ submit: message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    await authApi.forgotPassword(email);
    toast.success("Reset code resent! Check your email.");
  };

  if (success) {
    return (
      <AuthLayout title="Password Reset" subtitle="Your password has been updated">
        <div className="text-center py-8">
          <div className="flex justify-center mb-4">
            <FiCheckCircle className="text-6xl text-success" />
          </div>
          <p className="text-text-secondary">Redirecting you to login...</p>
        </div>
      </AuthLayout>
    );
  }

  if (step === 2) {
    return (
      <AuthLayout
        title="Reset Password"
        subtitle={
          <div className="flex items-center gap-2 justify-center">
            <FiMail className="text-text-secondary" />
            <span>Enter the code sent to {email}</span>
          </div>
        }
        showBackButton
        onBack={() => setStep(1)}
        footer={
          <ResendOtpButton onResend={handleResend} email={email} cooldownSeconds={60} />
        }
      >
        <form onSubmit={handleResetPassword}>
          <ErrorMessage message={errors.submit} />

          <FormSection>
            <OtpInput value={code} onChange={setCode} error={errors.code} />

            <Input
              label="New Password"
              type="password"
              placeholder="At least 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              error={errors.newPassword}
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
            />
          </FormSection>

          <Button type="submit" fullWidth loading={loading} disabled={loading || code.length !== 6}>
            Reset Password
          </Button>

          <AuthDivider />

          <div className="text-center">
            <AuthLink onClick={() => navigate("/login")}>Back to Login</AuthLink>
          </div>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot Password"
      subtitle="Enter your email and we'll send you a reset code"
      showBackButton
      onBack={() => navigate("/login")}
      footer={
        <>
          Remember your password?{" "}
          <AuthLink onClick={() => navigate("/login")}>Sign in</AuthLink>
        </>
      }
    >
      <form onSubmit={handleRequestReset}>
        <ErrorMessage message={errors.submit} />

        <FormSection>
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />
        </FormSection>

        <Button type="submit" fullWidth loading={loading} disabled={loading}>
          Send Reset Code
        </Button>
      </form>
    </AuthLayout>
  );
}
