import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiCheckCircle, FiMail } from "react-icons/fi";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { authApi } from "../../services/auth.api";
import { Button } from "../../components/ui";
import AuthLayout, { AuthDivider, AuthLink, ErrorMessage, FormSection } from "./AuthLayout";
import { OtpInput } from "./components/OtpInput";
import { ResendOtpButton } from "./components/ResendOtpButton";
import { forceLogout } from "../../auth/session";

function profilePathForRole(role) {
  if (role === "LAWYER") return "/lawyer/settings/profile";
  if (role === "CLIENT") return "/client/settings/profile";
  if (role === "ADMIN") return "/admin/overview";
  return "/login";
}

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, refreshUser, markVerified, isAuthenticated } = useAuth();
  const toast = useToast();

  const email = searchParams.get("email") || user?.email || "";
  const from = searchParams.get("from") || "";
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate("/register");
      return;
    }

    // Skip auto-send when coming from login/register (OTP already sent)
    if (from === "login" || from === "register") {
      setOtpSent(true);
      return;
    }

    const sendOtpOnLoad = async () => {
      if (!otpSent && email) {
        try {
          await authApi.sendOtp(email);
          setOtpSent(true);
          toast.success("Verification code sent to your email!");
        } catch (error) {
          console.error("Failed to send OTP on load:", error);
        }
      }
    };

    sendOtpOnLoad();
  }, [email, from, navigate, otpSent, toast]);

  const leaveSession = useCallback(
    async (path) => {
      setLeaving(true);
      try {
        if (isAuthenticated) {
          await forceLogout({ reason: "user", redirect: false, clearServerSession: true });
        }
        navigate(path, { replace: true });
      } catch (err) {
        console.error("Failed to leave verification:", err);
        navigate(path, { replace: true });
      } finally {
        setLeaving(false);
      }
    },
    [isAuthenticated, navigate]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (code.length !== 6) {
      setErrors({ code: "Please enter a 6-digit code" });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const res = await authApi.verifyOtp(email, code);
      const verifiedUser = res.data?.user;

      markVerified();

      if (isAuthenticated && refreshUser) {
        try {
          await refreshUser();
        } catch (err) {
          console.error("Failed to refresh user:", err);
        }
      }

      setSuccess(true);
      toast.success("Email verified successfully!");

      const role = verifiedUser?.role || user?.role;
      setTimeout(() => {
        navigate(profilePathForRole(role));
      }, 1500);
    } catch (error) {
      const message = error.response?.data?.message || "Verification failed. Please try again.";
      setErrors({
        submit: message,
        code:
          message.includes("code") || message.includes("Invalid") || message.includes("expired")
            ? message
            : null
      });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await authApi.resendOtp(email);
      setOtpSent(true);
      toast.success("Verification code resent! Please check your email.");
    } catch (error) {
      const message = error.response?.data?.message || "Failed to resend code. Please try again.";
      toast.error(message);
      throw error;
    }
  };

  if (success) {
    return (
      <AuthLayout
        title="Email Verified!"
        subtitle="Your email has been successfully verified"
      >
        <div className="text-center py-8">
          <div className="flex justify-center mb-4">
            <FiCheckCircle className="text-6xl text-success" />
          </div>
          <p className="text-text-secondary mb-6">Redirecting you to complete your profile...</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Verify Your Email"
      subtitle={
        <div className="flex items-center gap-2 justify-center">
          <FiMail className="text-text-secondary" />
          <span>We sent a verification code to {email}</span>
        </div>
      }
      footer={
        <ResendOtpButton
          onResend={handleResend}
          email={email}
          cooldownSeconds={60}
        />
      }
    >
      <form onSubmit={handleSubmit}>
        <ErrorMessage message={errors.submit} />

        <FormSection>
          <OtpInput value={code} onChange={setCode} error={errors.code} />
        </FormSection>

        <Button
          type="submit"
          fullWidth
          loading={loading}
          disabled={loading || leaving || code.length !== 6}
        >
          Verify Email
        </Button>

        <AuthDivider />

        <div className="text-center space-y-2">
          <p className="text-sm text-text-secondary m-0">
            Wrong email?{" "}
            <AuthLink onClick={() => !leaving && leaveSession("/register")}>
              Use a different email
            </AuthLink>
          </p>
          <p className="text-sm text-text-secondary m-0">
            {isAuthenticated ? (
              <AuthLink onClick={() => !leaving && leaveSession("/login")}>Sign out</AuthLink>
            ) : (
              <AuthLink onClick={() => navigate("/login")}>Back to login</AuthLink>
            )}
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
