import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../context/ThemeContext";

export default function Register() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    barNumber: "",
    city: "",
    specialization: "",
    experienceYears: "",
    hourlyRate: "",
    bio: "",
    company: "",
    legalNeeds: "",
    agreeTerms: false
  });
  const { register } = useAuth();
  const navigate = useNavigate();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleGoogleSuccess = async (response) => {
    setLoading(true);
    try {
      // Handle Google OAuth - for now just move to next step
      setStep(2);
    } catch (error) {
      console.error("Google login failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = (error) => {
    console.error("Google login error:", error);
  };

  const clearErrors = () => {
    setErrors({});
  };

  const handleInputChange = (field, value) => {
    setFormData({...formData, [field]: value});
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors({...errors, [field]: null});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    // Validation
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    } else if (formData.email && formData.email.toLowerCase() === formData.email.toLowerCase() && formData.email.length > 0) {
      // This is a simple check - in real app, you'd check against backend
      // For now, we'll let backend handle duplicate email detection
    }
    
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = "You must agree to Terms and Conditions";
    }
    
    // Lawyer-specific validation
    if (role === "LAWYER") {
      if (!formData.barNumber.trim()) {
        newErrors.barNumber = "Bar number is required";
      }
      
      if (!formData.city.trim()) {
        newErrors.city = "City is required";
      }
      
      if (!formData.specialization) {
        newErrors.specialization = "Specialization is required";
      }
      
      if (!formData.experienceYears) {
        newErrors.experienceYears = "Experience is required";
      }
      
      if (!formData.hourlyRate) {
        newErrors.hourlyRate = "Hourly rate is required";
      }
      
      if (!formData.bio.trim()) {
        newErrors.bio = "Bio is required";
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setLoading(true);
    try {
      const payload = { 
        role, 
        email: formData.email, 
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        company: formData.company,
        legalNeeds: formData.legalNeeds
      };
      
      if (role === "LAWYER") {
        payload.fullName = `${formData.firstName} ${formData.lastName}`;
        payload.barNumber = formData.barNumber;
        payload.city = formData.city;
        payload.specialization = formData.specialization;
        payload.experienceYears = formData.experienceYears;
        payload.hourlyRate = formData.hourlyRate;
        payload.bio = formData.bio;
      }
      
      await register(payload);
      navigate("/login");
    } catch (error) {
      console.error("Registration failed:", error);
      console.log("Error response:", error.response);
      console.log("Error data:", error.response?.data);
      console.log("Error message:", error.response?.data?.message);
      
      // Handle different error types
      if (error.response?.status === 409) {
        setErrors({ email: "This email is already registered" });
      } else if (error.response?.status === 400) {
        if (error.response?.data?.message?.toLowerCase().includes('email')) {
          setErrors({ email: "This email is already registered" });
        } else if (error.response?.data?.message?.toLowerCase().includes('exists')) {
          setErrors({ email: "This email is already registered" });
        } else {
          setErrors({ submit: error.response?.data?.message || "Registration failed. Please try again." });
        }
      } else {
        setErrors({ submit: error.response?.data?.message || "Registration failed. Please try again." });
      }
    } finally {
      setLoading(false);
    }
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
      marginBottom: '8px',
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
    },
    roleButton: {
      width: '48%',
      padding: '16px',
      borderRadius: '4px',
      border: `1px solid ${colors.border}`,
      backgroundColor: colors.surface,
      color: colors.text.primary,
      cursor: 'pointer',
      textAlign: 'center'
    },
    roleButtonActive: {
      border: `1px solid ${colors.button.primary}`,
      backgroundColor: colors.button.primary,
      color: colors.button.primaryText
    }
  };

  if (step === 1) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Create Account</h1>
          <p style={styles.subtitle}>Choose how you want to sign up</p>
          
          <div style={{ marginBottom: '24px' }}>
            <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                text="signup_with"
                theme="filled_black"
                size="large"
                width="100%"
              />
            </GoogleOAuthProvider>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '24px', color: colors.text.muted }}>
            or continue with email
          </div>

          <button
            style={styles.secondaryButton}
            onClick={() => setStep(2)}
          >
            Sign up with Email
          </button>

          <div style={{ textAlign: 'center', fontSize: '14px', color: colors.text.secondary }}>
            Already have an account?{' '}
            <span 
              style={{ color: colors.button.primary, cursor: 'pointer' }}
              onClick={() => navigate('/login')}
            >
              Sign in
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Choose Your Role</h1>
          <p style={styles.subtitle}>Are you looking for legal help or providing services?</p>
          
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <button
              style={{
                ...styles.roleButton,
                ...(role === 'CLIENT' ? styles.roleButtonActive : {})
              }}
              onClick={() => setRole('CLIENT')}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>👤</div>
              <div style={{ fontWeight: '500' }}>Client</div>
              <div style={{ fontSize: '12px', color: colors.text.secondary, marginTop: '4px' }}>
                Looking for legal help
              </div>
            </button>
            
            <button
              style={{
                ...styles.roleButton,
                ...(role === 'LAWYER' ? styles.roleButtonActive : {})
              }}
              onClick={() => setRole('LAWYER')}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚖️</div>
              <div style={{ fontWeight: '500' }}>Lawyer</div>
              <div style={{ fontSize: '12px', color: colors.text.secondary, marginTop: '4px' }}>
                Providing services
              </div>
            </button>
          </div>

          <button
            style={styles.button}
            onClick={() => setStep(3)}
            disabled={!role}
          >
            Continue
          </button>

          <button
            style={styles.secondaryButton}
            onClick={() => setStep(1)}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Complete Registration</h1>
        <p style={styles.subtitle}>
          {role === 'CLIENT' ? 'Create your client account' : 'Create your lawyer profile'}
        </p>
        
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <input
                type="text"
                placeholder="First Name"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                style={{
                  ...styles.input,
                  ...(errors.firstName ? styles.inputError : {})
                }}
                required
              />
              {errors.firstName && <div style={styles.errorText}>{errors.firstName}</div>}
            </div>
            <div>
              <input
                type="text"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                style={{
                  ...styles.input,
                  ...(errors.lastName ? styles.inputError : {})
                }}
                required
              />
              {errors.lastName && <div style={styles.errorText}>{errors.lastName}</div>}
            </div>
          </div>
          
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            style={{
              ...styles.input,
              ...(errors.email ? styles.inputError : {})
            }}
            required
          />
          {errors.email && <div style={styles.errorText}>{errors.email}</div>}
          
          <input
            type="tel"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            style={styles.input}
          />
          
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            style={{
              ...styles.input,
              ...(errors.password ? styles.inputError : {})
            }}
            required
          />
          {errors.password && <div style={styles.errorText}>{errors.password}</div>}
          
          <input
            type="password"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            style={{
              ...styles.input,
              ...(errors.confirmPassword ? styles.inputError : {})
            }}
            required
          />
          {errors.confirmPassword && <div style={styles.errorText}>{errors.confirmPassword}</div>}

          {role === 'LAWYER' && (
            <>
              <input
                type="text"
                placeholder="Bar Number"
                value={formData.barNumber}
                onChange={(e) => handleInputChange('barNumber', e.target.value)}
                style={{
                  ...styles.input,
                  ...(errors.barNumber ? styles.inputError : {})
                }}
                required
              />
              {errors.barNumber && <div style={styles.errorText}>{errors.barNumber}</div>}
              
              <input
                type="text"
                placeholder="City"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                style={{
                  ...styles.input,
                  ...(errors.city ? styles.inputError : {})
                }}
                required
              />
              {errors.city && <div style={styles.errorText}>{errors.city}</div>}
              
              <select
                value={formData.specialization}
                onChange={(e) => handleInputChange('specialization', e.target.value)}
                style={{
                  ...styles.input,
                  cursor: 'pointer',
                  ...(errors.specialization ? styles.inputError : {})
                }}
                required
              >
                <option value="">Select Specialization</option>
                <option value="family">Family Law</option>
                <option value="corporate">Corporate Law</option>
                <option value="criminal">Criminal Law</option>
                <option value="immigration">Immigration Law</option>
                <option value="estate">Estate Planning</option>
                <option value="tax">Tax Law</option>
                <option value="intellectual-property">Intellectual Property</option>
                <option value="personal-injury">Personal Injury</option>
                <option value="employment">Employment Law</option>
                <option value="real-estate">Real Estate Law</option>
              </select>
              {errors.specialization && <div style={styles.errorText}>{errors.specialization}</div>}
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <input
                  type="number"
                  placeholder="Years of Experience"
                  value={formData.experienceYears}
                  onChange={(e) => handleInputChange('experienceYears', e.target.value)}
                  style={{
                    ...styles.input,
                    ...(errors.experienceYears ? styles.inputError : {})
                  }}
                  required
                />
                {errors.experienceYears && <div style={styles.errorText}>{errors.experienceYears}</div>}
                <input
                  type="number"
                  placeholder="Hourly Rate ($)"
                  value={formData.hourlyRate}
                  onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                  style={{
                    ...styles.input,
                    ...(errors.hourlyRate ? styles.inputError : {})
                  }}
                  required
                />
                {errors.hourlyRate && <div style={styles.errorText}>{errors.hourlyRate}</div>}
              </div>
              
              <textarea
                placeholder="Professional Bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                style={{
                  ...styles.input,
                  minHeight: '100px',
                  resize: 'vertical',
                  ...(errors.bio ? styles.inputError : {})
                }}
                required
              />
              {errors.bio && <div style={styles.errorText}>{errors.bio}</div>}
            </>
          )}

          {role === 'CLIENT' && (
            <>
              <input
                type="text"
                placeholder="Company (Optional)"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                style={styles.input}
              />
              
              <textarea
                placeholder="Tell us about your legal needs..."
                value={formData.legalNeeds}
                onChange={(e) => handleInputChange('legalNeeds', e.target.value)}
                style={{ ...styles.input, minHeight: '100px', resize: 'vertical' }}
              />
            </>
          )}
          
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <input
              type="checkbox"
              id="terms"
              checked={formData.agreeTerms}
              onChange={(e) => {
    setFormData({...formData, agreeTerms: e.target.checked});
    // Clear error when user checks the box
    if (errors.agreeTerms) {
      setErrors({...errors, agreeTerms: null});
    }
  }}
              style={{ marginRight: '8px' }}
              required
            />
            <label htmlFor="terms" style={{ color: colors.text.secondary }}>
              I agree to Terms and Conditions
            </label>
          </div>
          {errors.agreeTerms && <div style={styles.errorText}>{errors.agreeTerms}</div>}
          {errors.submit && <div style={styles.errorText}>{errors.submit}</div>}
          
          <button
            type="submit"
            style={styles.button}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <button
          style={styles.secondaryButton}
          onClick={() => setStep(2)}
        >
          Back
        </button>

        <div style={{ textAlign: 'center', fontSize: '14px', color: colors.text.secondary }}>
          Already have an account?{' '}
          <span 
            style={{ color: colors.button.primary, cursor: 'pointer' }}
            onClick={() => navigate('/login')}
          >
            Sign in
          </span>
        </div>
      </div>
    </div>
  );
}
