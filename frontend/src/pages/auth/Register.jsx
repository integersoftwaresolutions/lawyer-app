import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { useStepNavigation } from "../../hooks/useStepNavigation";
import { useAuthForm } from "../../hooks/useAuthForm";
import AuthLayout, { AuthLink } from "./AuthLayout";
import { RegisterMethodStep } from "./steps/RegisterMethodStep";
import { RoleSelectionStep } from "./steps/RoleSelectionStep";
import { RegistrationFormStep } from "./steps/RegistrationFormStep";

const INITIAL_FORM_DATA = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  agreeTerms: false,
};

const REGISTER_STEPS = {
  METHOD: 1,
  ROLE: 2,
  FORM: 3
};

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, login } = useAuth();
  const toast = useToast();
  const requestedRole = searchParams.get("role")?.toUpperCase();
  const initialRole = ["CLIENT", "LAWYER"].includes(requestedRole) ? requestedRole : "";
  
  const { step, goNext, goBack, goTo, canGoBack } = useStepNavigation(REGISTER_STEPS.METHOD, {
    defaultBackPath: initialRole ? `/login?role=${initialRole}` : "/login"
  });
  
  const { formData, errors, loading, setLoading, handleChange, setError, setErrors, clearErrors } = useAuthForm(INITIAL_FORM_DATA);
  const [role, setRole] = useState(initialRole);

  const validate = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Name must be at least 2 characters";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }
    
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }
    
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = "You must agree to continue";
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
      const payload = {
        role,
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName.trim(),
      };
      
      await register(payload);

      // Auto-login so verify-email flow has an active session
      await login({ email: formData.email, password: formData.password });

      toast.success("Registration successful! Please verify your email.");
      navigate(`/verify-email?email=${encodeURIComponent(formData.email)}&from=register`);
    } catch (error) {
      const message = error.response?.data?.message || "Registration failed. Please try again.";
      if (error.response?.status === 409) {
        setError("email", "This email is already registered");
      } else {
        setError("submit", message);
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
  };

  const handleMethodContinue = () => {
    if (role) {
      goTo(REGISTER_STEPS.FORM);
      return;
    }
    goNext();
  };

  const handleBack = () => {
    if (step === REGISTER_STEPS.FORM && initialRole) {
      goTo(REGISTER_STEPS.METHOD);
      return;
    }
    goBack();
  };

  const authFooter = (
    <>
      Already have an account?{" "}
      <AuthLink onClick={() => navigate(role ? `/login?role=${role}` : "/login")}>
        Sign in
      </AuthLink>
    </>
  );

  const getStepTitle = () => {
    switch (step) {
      case REGISTER_STEPS.METHOD:
        return {
          title: role ? `Create ${role === "LAWYER" ? "Lawyer" : "Client"} Account` : "Create Account",
          subtitle: "Get started with your free account"
        };
      case REGISTER_STEPS.ROLE:
        return { title: "Choose Your Role", subtitle: "How will you be using the platform?" };
      case REGISTER_STEPS.FORM:
        return { title: "Create Your Account", subtitle: "Enter your basic information to get started" };
      default:
        return { title: "", subtitle: "" };
    }
  };

  const { title, subtitle } = getStepTitle();

  return (
    <AuthLayout
      title={title}
      subtitle={subtitle}
      showBackButton={canGoBack}
      onBack={handleBack}
      footer={authFooter}
    >
      {step === REGISTER_STEPS.METHOD && (
        <RegisterMethodStep
          onEmailClick={handleMethodContinue}
          onGoogleSuccess={handleMethodContinue}
        />
      )}

      {step === REGISTER_STEPS.ROLE && (
        <RoleSelectionStep
          selectedRole={role}
          onRoleSelect={handleRoleSelect}
          onContinue={goNext}
              />
        )}

      {step === REGISTER_STEPS.FORM && (
        <RegistrationFormStep
          formData={formData}
          errors={errors}
          loading={loading}
          onChange={handleChange}
          onSubmit={handleSubmit}
        />
      )}
    </AuthLayout>
  );
}
