import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useAuth } from "../../hooks/useAuth";
import { Input, Button } from "../../components/ui";
import AuthLayout, { AuthDivider, AuthLink, ErrorMessage, FormSection } from "./AuthLayout";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

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
    setErrors({});
    
    try {
      const res = await login(formData);
      
      // Check if email is verified
      if (!res.data.user?.isEmailVerified) {
        navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`);
        return;
      }
      
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
        setErrors({ email: "No account found with this email" });
      } else if (lowerMessage.includes('password')) {
        setErrors({ password: "Incorrect password" });
      } else {
        setErrors({ submit: message });
      }
    } else if (statusCode === 404) {
      setErrors({ email: "No account found with this email" });
    } else {
      setErrors({ submit: message });
    }
  };

  const handleGoogleSuccess = async (response) => {
    setLoading(true);
    try {
      console.log("Google login success:", response);
    } catch (error) {
      console.error("Google login failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to continue to your account"
      footer={
        <>
          Don't have an account?{" "}
          <AuthLink onClick={() => navigate("/register")}>Create one</AuthLink>
        </>
      }
    >
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={console.error}
          text="signin_with"
          theme="filled_black"
          size="large"
          width="100%"
        />
      </GoogleOAuthProvider>

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
