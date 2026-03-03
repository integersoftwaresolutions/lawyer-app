import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { useAuthForm } from "../../hooks/useAuthForm";
import { Input, Button } from "../../components/ui";
import AuthLayout, { AuthDivider, AuthLink, ErrorMessage, FormSection } from "./AuthLayout";
import { GoogleAuthButton } from "./components/GoogleAuthButton";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const toast = useToast();
  const fromVerify = searchParams.get("from") === "verify";
  
  const { formData, errors, loading, setLoading, handleChange, setError, setErrors, clearErrors } = useAuthForm({
    email: "",
    password: ""
  });

  const validate = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setLoading(true);
    clearErrors();
    
    try {
      const res = await login(formData);
      
      // Check if email is verified
      if (!res.data.user?.isEmailVerified) {
        navigate(`/verify-email?email=${encodeURIComponent(formData.email)}&from=login`);
        return;
      }
      
      toast.success("Login successful!");
      const redirectMap = {
        CLIENT: "/client/dashboard",
        LAWYER: "/lawyer/dashboard",
        ADMIN: "/admin/dashboard",
      };
      navigate(redirectMap[res.data.user?.role || res.data.role] || "/");
    } catch (error) {
      handleLoginError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginError = (error) => {
    const message = error.response?.data?.message || error.message || "Login failed";
    const statusCode = error.response?.status;
    const lowerMessage = message.toLowerCase();

    if (statusCode === 401 || statusCode === 400) {
      if (lowerMessage.includes('email') && (lowerMessage.includes('not found') || lowerMessage.includes('user'))) {
        setError("email", "No account found with this email");
        toast.error("No account found with this email");
      } else if (lowerMessage.includes('password') || lowerMessage.includes('invalid credentials')) {
        setError("password", "Incorrect password");
        toast.error("Incorrect password");
      } else {
        setError("submit", message);
        toast.error(message);
      }
    } else if (statusCode === 404) {
      setError("email", "No account found with this email");
      toast.error("No account found with this email");
    } else {
      setError("submit", message);
      toast.error(message);
    }
  };

  const handleGoogleSuccess = async (response) => {
    setLoading(true);
    try {
      console.log("Google login success:", response);
      // TODO: Implement Google OAuth login
    } catch (error) {
      console.error("Google login failed:", error);
      toast.error("Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (fromVerify) {
      navigate("/verify-email?email=" + encodeURIComponent(formData.email || ""));
    } else {
      navigate(-1);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to continue to your account"
      showBackButton={fromVerify}
      onBack={handleBack}
      footer={
        <>
          Don't have an account?{" "}
          <AuthLink onClick={() => navigate("/register")}>Create one</AuthLink>
        </>
      }
    >
      <GoogleAuthButton 
          onSuccess={handleGoogleSuccess}
          text="signin_with"
        disabled={loading}
        />

      <AuthDivider text="or continue with email" />

      <form onSubmit={handleSubmit}>
        <ErrorMessage message={errors.submit} />

        <FormSection>
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange("email")}
            error={errors.email}
          />
          
          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange("password")}
            error={errors.password}
          />
        </FormSection>

        <Button
          type="submit"
          fullWidth
          loading={loading}
          disabled={loading}
        >
          Sign In
        </Button>
      </form>
    </AuthLayout>
  );
}
