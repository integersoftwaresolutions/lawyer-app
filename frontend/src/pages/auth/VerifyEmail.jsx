import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiCheckCircle, FiMail } from "react-icons/fi";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { authApi } from "../../services/auth.api";
import { Button } from "../../components/ui";
import AuthLayout, { AuthDivider, AuthLink, ErrorMessage, FormSection } from "./AuthLayout";
import { OtpInput } from "./components/OtpInput";
import { ResendOtpButton } from "./components/ResendOtpButton";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  
  const email = searchParams.get("email") || user?.email || "";
  const from = searchParams.get("from") || ""; // "register" or "login"
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate("/register");
      return;
    }

    // Automatically send OTP when page loads (if coming from login or if not sent yet)
    const sendOtpOnLoad = async () => {
      if (!otpSent && email) {
        try {
          await authApi.sendOtp(email);
          setOtpSent(true);
          toast.success("Verification code sent to your email!");
        } catch (error) {
          const message = error.response?.data?.message || "Failed to send verification code";
          console.error("Failed to send OTP on load:", error);
          // Don't show error toast here - user can manually resend
        }
      }
    };

    sendOtpOnLoad();
  }, [email, navigate, otpSent, toast]);

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
      toast.success("Email verified successfully!");
      
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
          CLIENT: "/client/profile",
          LAWYER: "/lawyer/profile",
          ADMIN: "/admin/dashboard",
        };
        navigate(redirectMap[user?.role] || "/login");
      }, 2000);
    } catch (error) {
      const message = error.response?.data?.message || "Verification failed. Please try again.";
      setErrors({ 
        submit: message, 
        code: message.includes("code") || message.includes("Invalid") || message.includes("expired") ? message : null 
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

  const handleBack = () => {
    if (from === "login") {
      navigate(`/login?from=verify&email=${encodeURIComponent(email)}`);
    } else if (from === "register") {
      navigate("/register");
    } else {
      navigate("/login");
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
          <span>We've sent a verification code to {email}</span>
        </div>
      }
      showBackButton={!!from}
      onBack={handleBack}
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
          <OtpInput
            value={code}
            onChange={setCode}
            error={errors.code}
          />
        </FormSection>

        <Button
          type="submit"
          fullWidth
          loading={loading}
          disabled={loading || code.length !== 6}
        >
          Verify Email
        </Button>

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
