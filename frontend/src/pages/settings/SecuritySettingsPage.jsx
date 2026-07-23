import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCheckCircle, FiLock, FiMail, FiShield } from "react-icons/fi";
import { authApi } from "../../services/auth.api";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { Badge, Button, Card, Input, PageHeader } from "../../components/ui";
import { FormSection } from "../auth/AuthLayout";

const INITIAL_FORM = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: ""
};

export default function SecuritySettingsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, logout } = useAuth();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);

  const handleChange = (field) => (event) => {
    setFormData((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined, submit: undefined }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!formData.currentPassword) {
      nextErrors.currentPassword = "Current password is required";
    }
    if (!formData.newPassword) {
      nextErrors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 6) {
      nextErrors.newPassword = "Password must be at least 6 characters";
    } else if (formData.newPassword === formData.currentPassword) {
      nextErrors.newPassword = "New password must be different from current password";
    }
    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your new password";
    } else if (formData.confirmPassword !== formData.newPassword) {
      nextErrors.confirmPassword = "Passwords do not match";
    }
    return nextErrors;
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    try {
      setSaving(true);
      setErrors({});
      await authApi.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      toast.success("Password changed successfully. Please sign in again.");
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      const message = error.response?.data?.message || "Failed to change password";
      if (message.toLowerCase().includes("current password")) {
        setErrors({ currentPassword: message });
      } else {
        setErrors({ submit: message });
      }
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyEmail = async () => {
    try {
      setSendingVerification(true);
      await authApi.resendOtp(user.email);
      toast.success("Verification code sent to your email.");
      navigate(`/verify-email?email=${encodeURIComponent(user.email)}&from=settings`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send verification code");
    } finally {
      setSendingVerification(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        icon={FiShield}
        title="Security"
        subtitle="Review your email status and protect your account"
      />

      <Card
        title="Email verification"
        subtitle="Your verified email is used for account recovery and important updates"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
              <FiMail className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="m-0 truncate text-sm font-semibold text-text-primary">{user?.email}</p>
              <p className="m-0 mt-0.5 text-xs text-text-muted">
                {user?.isEmailVerified
                  ? "This email address has been verified."
                  : "Verify this email before using protected features."}
              </p>
            </div>
          </div>

          {user?.isEmailVerified ? (
            <Badge variant="success" size="md" bordered>
              <FiCheckCircle className="mr-1.5 h-4 w-4" />
              Verified
            </Badge>
          ) : (
            <Button
              size="sm"
              icon={FiMail}
              loading={sendingVerification}
              onClick={handleVerifyEmail}
            >
              Verify email
            </Button>
          )}
        </div>
      </Card>

      <Card
        title="Change password"
        subtitle="Use a unique password that you do not use on other websites"
      >
        <form onSubmit={handleChangePassword} className="max-w-xl">
          {errors.submit ? (
            <p className="mb-4 rounded-lg bg-danger-light px-3 py-2 text-sm text-danger">
              {errors.submit}
            </p>
          ) : null}

          <FormSection>
            <Input
              label="Current password"
              type="password"
              autoComplete="current-password"
              value={formData.currentPassword}
              onChange={handleChange("currentPassword")}
              error={errors.currentPassword}
              placeholder="Enter your current password"
            />
            <Input
              label="New password"
              type="password"
              autoComplete="new-password"
              value={formData.newPassword}
              onChange={handleChange("newPassword")}
              error={errors.newPassword}
              helperText="At least 6 characters"
              placeholder="Enter a new password"
            />
            <Input
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange("confirmPassword")}
              error={errors.confirmPassword}
              placeholder="Re-enter your new password"
            />
          </FormSection>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() =>
                navigate(`/forgot-password?email=${encodeURIComponent(user?.email || "")}`)
              }
              className="text-sm text-primary hover:underline"
            >
              Forgot current password?
            </button>
            <Button type="submit" icon={FiLock} loading={saving}>
              Change password
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
