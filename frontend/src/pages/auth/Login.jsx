import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../context/ThemeContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useAuth();
  const navigate = useNavigate();
  const { colors } = useTheme();

  const handleInputChange = (field, value) => {
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors({...errors, [field]: null});
    }
    if (field === 'email') setEmail(value);
    if (field === 'password') setPassword(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    // Validation
    const newErrors = {};
    
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }
    
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    if (Object.keys(newErrors).length > 0) {
      console.log("Setting validation errors:", newErrors);
      setErrors(newErrors);
      return;
    }
    
    // Test: Show validation error to ensure display works
    if (!email.trim() || !password.trim()) {
      console.log("Showing test validation error");
      setErrors({ 
        email: !email.trim() ? "Email is required" : null,
        password: !password.trim() ? "Password is required" : null
      });
      return;
    }
    
    setLoading(true);
    try {
      const res = await login({ email, password });
      // Redirect based on user role
      if (res.data.role === "CLIENT") {
        navigate("/client/dashboard");
      } else if (res.data.role === "LAWYER") {
        navigate("/lawyer/dashboard");
      } else if (res.data.role === "ADMIN") {
        navigate("/admin/dashboard");
      }
    } catch (error) {
      console.error("Login failed:", error);
      console.log("Full error object:", error);
      console.log("Error response:", error.response);
      console.log("Error data:", error.response?.data);
      console.log("Error message:", error.response?.data?.message);
      console.log("Error status:", error.response?.status);
      console.log("Error statusCode:", error.response?.data?.statusCode);
      
      // Get error message from various possible locations
      const errorMessage = error.response?.data?.message || 
                         error.response?.data?.error || 
                         error.response?.data?.detail || 
                         error.message || 
                         "Login failed";
      
      // Check for statusCode specifically (as seen in your error log)
      const statusCode = error.response?.data?.statusCode || error.response?.status;
      
      console.log("Final error message to process:", errorMessage);
      console.log("Status code:", statusCode);
      
      // Handle different error types with comprehensive keyword detection
      const lowerError = errorMessage.toLowerCase();
      
      if (statusCode === 401 || statusCode === 400) {
        // For 401, always show error message since it's authentication failure
        if (lowerError.includes('email') && (lowerError.includes('not found') || lowerError.includes('user'))) {
          setErrors({ email: "Email not found" });
        } else if (lowerError.includes('password') && (lowerError.includes('incorrect') || lowerError.includes('wrong'))) {
          setErrors({ password: "Incorrect password" });
        } else {
          // For any other 401/400 error, show the actual message
          setErrors({ submit: errorMessage });
        }
      } else if (statusCode === 404) {
        setErrors({ email: "Email not found" });
      } else {
        // Fallback - show the error message
        console.log("Using fallback error message:", errorMessage);
        setErrors({ submit: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (response) => {
    setLoading(true);
    try {
      // Handle Google OAuth
      console.log("Google login success:", response);
      // TODO: Implement Google login logic
    } catch (error) {
      console.error("Google login failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = (error) => {
    console.error("Google login error:", error);
  };

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      backgroundColor: colors.background,
      color: colors.text.primary
    },
    card: {
      width: '100%',
      maxWidth: '400px',
      padding: '40px',
      borderRadius: '8px',
      border: `1px solid ${colors.border}`,
      backgroundColor: colors.card
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      marginBottom: '8px',
      color: colors.text.primary
    },
    subtitle: {
      fontSize: '14px',
      marginBottom: '24px',
      color: colors.text.secondary
    },
    input: {
      width: '100%',
      padding: '12px',
      marginBottom: '16px',
      borderRadius: '4px',
      border: `1px solid ${colors.input.border}`,
      backgroundColor: colors.input.background,
      color: colors.input.text,
      fontSize: '14px'
    },
    inputError: {
      border: `1px solid #dc3545`
    },
    errorText: {
      fontSize: '12px',
      color: '#dc3545',
      marginTop: '4px'
    },
    button: {
      width: '100%',
      padding: '12px',
      borderRadius: '4px',
      border: 'none',
      backgroundColor: colors.button.primary,
      color: colors.button.primaryText,
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      marginBottom: '16px'
    },
    secondaryButton: {
      width: '100%',
      padding: '12px',
      borderRadius: '4px',
      border: `1px solid ${colors.border}`,
      backgroundColor: colors.button.secondary,
      color: colors.button.secondaryText,
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      marginBottom: '16px'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Welcome Back</h1>
        <p style={styles.subtitle}>Sign in to your account</p>
        
        <div style={{ marginBottom: '24px' }}>
          <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              text="signin_with"
              theme="filled_black"
              size="large"
              width="100%"
            />
          </GoogleOAuthProvider>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '24px', color: colors.text.muted }}>
          or continue with email
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            style={{
              ...styles.input,
              ...(errors.email ? styles.inputError : {})
            }}
            required
          />
          {errors.email && <div style={styles.errorText}>{errors.email}</div>}
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            style={{
              ...styles.input,
              ...(errors.password ? styles.inputError : {})
            }}
            required
          />
          {errors.password && <div style={styles.errorText}>{errors.password}</div>}
          
          {errors.submit && <div style={styles.errorText}>{errors.submit}</div>}
          
          <button
            type="submit"
            style={styles.button}
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '14px', color: colors.text.secondary }}>
          Don't have an account?{' '}
          <span 
            style={{ color: colors.button.primary, cursor: 'pointer' }}
            onClick={() => navigate('/register')}
          >
            Sign up
          </span>
        </div>
      </div>
    </div>
  );
}
