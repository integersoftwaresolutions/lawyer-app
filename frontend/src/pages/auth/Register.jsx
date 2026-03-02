import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../context/ThemeContext";
import { Input, Button, Select, Textarea, Checkbox } from "../../components/ui";
import AuthLayout, { AuthDivider, AuthLink, ErrorMessage, FormSection, FormRow } from "./AuthLayout";

const SPECIALIZATIONS = [
  { value: "family", label: "Family Law" },
  { value: "corporate", label: "Corporate Law" },
  { value: "criminal", label: "Criminal Law" },
  { value: "immigration", label: "Immigration Law" },
  { value: "estate", label: "Estate Planning" },
  { value: "tax", label: "Tax Law" },
  { value: "intellectual-property", label: "Intellectual Property" },
  { value: "personal-injury", label: "Personal Injury" },
  { value: "employment", label: "Employment Law" },
  { value: "real-estate", label: "Real Estate Law" },
];

const INITIAL_FORM_DATA = {
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
  agreeTerms: false,
};

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { colors } = useTheme();
  
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("");
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const handleGoogleSuccess = async () => {
    setStep(2);
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = "Required";
    if (!formData.lastName.trim()) newErrors.lastName = "Required";
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }
    
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "At least 6 characters";
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }
    
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = "You must agree to continue";
    }
    
    if (role === "LAWYER") {
      if (!formData.barNumber.trim()) newErrors.barNumber = "Required";
      if (!formData.city.trim()) newErrors.city = "Required";
      if (!formData.specialization) newErrors.specialization = "Required";
      if (!formData.experienceYears) newErrors.experienceYears = "Required";
      if (!formData.hourlyRate) newErrors.hourlyRate = "Required";
      if (!formData.bio.trim()) newErrors.bio = "Required";
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
      const payload = {
        role,
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        company: formData.company,
        legalNeeds: formData.legalNeeds,
      };
      
      if (role === "LAWYER") {
        Object.assign(payload, {
          fullName: `${formData.firstName} ${formData.lastName}`,
          barNumber: formData.barNumber,
          city: formData.city,
          specialization: formData.specialization,
          experienceYears: formData.experienceYears,
          hourlyRate: formData.hourlyRate,
          bio: formData.bio,
        });
      }
      
      await register(payload);
      navigate("/login");
    } catch (error) {
      handleRegistrationError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrationError = (error) => {
    const message = error.response?.data?.message || "";
    const status = error.response?.status;
    
    if (status === 409 || message.toLowerCase().includes('email') || message.toLowerCase().includes('exists')) {
      setErrors({ email: "This email is already registered" });
    } else {
      setErrors({ submit: message || "Registration failed. Please try again." });
    }
  };

  const authFooter = (
    <>
      Already have an account?{" "}
      <AuthLink onClick={() => navigate("/login")}>Sign in</AuthLink>
    </>
  );

  // Step 1: Choose sign up method
  if (step === 1) {
    return (
      <AuthLayout
        title="Create Account"
        subtitle="Get started with your free account"
        footer={authFooter}
      >
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={console.error}
            text="signup_with"
            theme="filled_black"
            size="large"
            width="100%"
          />
        </GoogleOAuthProvider>

        <AuthDivider text="or continue with email" />

        <Button variant="secondary" fullWidth onClick={() => setStep(2)}>
          Sign up with Email
        </Button>
      </AuthLayout>
    );
  }

  // Step 2: Choose role
  if (step === 2) {
    return (
      <AuthLayout
        title="Choose Your Role"
        subtitle="How will you be using the platform?"
        showBackButton
        onBack={() => setStep(1)}
        footer={authFooter}
      >
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <RoleCard
            icon="👤"
            title="Client"
            description="Find legal help"
            selected={role === "CLIENT"}
            onClick={() => setRole("CLIENT")}
            colors={colors}
          />
          <RoleCard
            icon="⚖️"
            title="Lawyer"
            description="Offer services"
            selected={role === "LAWYER"}
            onClick={() => setRole("LAWYER")}
            colors={colors}
          />
        </div>

        <Button fullWidth onClick={() => setStep(3)} disabled={!role}>
          Continue
        </Button>
      </AuthLayout>
    );
  }

  // Step 3: Registration form
  return (
    <AuthLayout
      title={role === "CLIENT" ? "Client Registration" : "Lawyer Registration"}
      subtitle="Complete your profile to get started"
      maxWidth={role === "LAWYER" ? "480px" : "420px"}
      showBackButton
      onBack={() => setStep(2)}
      footer={authFooter}
    >
      <form onSubmit={handleSubmit}>
        <ErrorMessage message={errors.submit} />

        <FormSection title="Personal Information">
          <FormRow>
            <Input
              label="First Name"
              placeholder="John"
              value={formData.firstName}
              onChange={handleChange("firstName")}
              error={errors.firstName}
            />
            <Input
              label="Last Name"
              placeholder="Doe"
              value={formData.lastName}
              onChange={handleChange("lastName")}
              error={errors.lastName}
            />
          </FormRow>
          
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange("email")}
            error={errors.email}
          />
          
          <Input
            label="Phone Number"
            type="tel"
            placeholder="+1 (555) 000-0000"
            value={formData.phone}
            onChange={handleChange("phone")}
            helperText="Optional"
          />
        </FormSection>

        <FormSection title="Security">
          <Input
            label="Password"
            type="password"
            placeholder="Create a password"
            value={formData.password}
            onChange={handleChange("password")}
            error={errors.password}
            helperText={!errors.password ? "At least 6 characters" : undefined}
          />
          
          <Input
            label="Confirm Password"
            type="password"
            placeholder="Repeat your password"
            value={formData.confirmPassword}
            onChange={handleChange("confirmPassword")}
            error={errors.confirmPassword}
          />
        </FormSection>

        {role === "LAWYER" && (
          <>
            <FormSection title="Professional Details">
              <FormRow>
                <Input
                  label="Bar Number"
                  placeholder="123456"
                  value={formData.barNumber}
                  onChange={handleChange("barNumber")}
                  error={errors.barNumber}
                />
                <Input
                  label="City"
                  placeholder="New York"
                  value={formData.city}
                  onChange={handleChange("city")}
                  error={errors.city}
                />
              </FormRow>
              
              <Select
                label="Specialization"
                value={formData.specialization}
                onChange={handleChange("specialization")}
                options={SPECIALIZATIONS}
                placeholder="Select your specialty"
                error={errors.specialization}
              />
              
              <FormRow>
                <Input
                  label="Experience"
                  type="number"
                  placeholder="Years"
                  value={formData.experienceYears}
                  onChange={handleChange("experienceYears")}
                  error={errors.experienceYears}
                />
                <Input
                  label="Hourly Rate"
                  type="number"
                  placeholder="$ per hour"
                  value={formData.hourlyRate}
                  onChange={handleChange("hourlyRate")}
                  error={errors.hourlyRate}
                />
              </FormRow>
            </FormSection>

            <FormSection title="About You">
              <Textarea
                label="Professional Bio"
                placeholder="Tell potential clients about your experience, expertise, and approach..."
                value={formData.bio}
                onChange={handleChange("bio")}
                error={errors.bio}
                rows={4}
              />
            </FormSection>
          </>
        )}

        {role === "CLIENT" && (
          <FormSection title="Additional Information">
            <Input
              label="Company"
              placeholder="Company name"
              value={formData.company}
              onChange={handleChange("company")}
              helperText="Optional"
            />
            
            <Textarea
              label="Legal Needs"
              placeholder="Briefly describe what kind of legal help you're looking for..."
              value={formData.legalNeeds}
              onChange={handleChange("legalNeeds")}
              rows={3}
              helperText="Optional - helps us recommend lawyers"
            />
          </FormSection>
        )}

        <Checkbox
          id="terms"
          label="I agree to the Terms of Service and Privacy Policy"
          checked={formData.agreeTerms}
          onChange={handleChange("agreeTerms")}
          error={errors.agreeTerms}
        />

        <Button type="submit" fullWidth loading={loading} disabled={loading}>
          Create Account
        </Button>
      </form>
    </AuthLayout>
  );
}

function RoleCard({ icon, title, description, selected, onClick, colors }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        padding: '20px 16px',
        borderRadius: '8px',
        border: `2px solid ${selected ? colors.button.primary : colors.border}`,
        backgroundColor: selected ? `${colors.button.primary}15` : 'transparent',
        color: colors.text.primary,
        cursor: 'pointer',
        textAlign: 'center',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ fontSize: '28px', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontWeight: '600', marginBottom: '4px' }}>{title}</div>
      <div style={{ fontSize: '12px', color: colors.text.secondary }}>
        {description}
      </div>
    </button>
  );
}
