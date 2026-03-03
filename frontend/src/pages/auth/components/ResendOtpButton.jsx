import { useState, useEffect } from "react";
import { AuthLink } from "../AuthLayout";

export function ResendOtpButton({ onResend, email, cooldownSeconds = 60 }) {
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || loading) return;
    
    setLoading(true);
    try {
      await onResend();
      setCooldown(cooldownSeconds);
    } catch (error) {
      // Error is handled by parent component via toast
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = cooldown > 0 || loading;

  return (
    <>
      Didn't receive the code?{" "}
      {isDisabled ? (
        <span className="text-text-muted">
          {loading ? "Sending..." : `Resend in ${cooldown}s`}
        </span>
      ) : (
        <AuthLink onClick={handleResend}>
          Resend Code
        </AuthLink>
      )}
    </>
  );
}

