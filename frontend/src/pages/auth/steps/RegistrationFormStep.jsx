import { Input, Button, Checkbox } from "../../../components/ui";
import { FormSection, ErrorMessage } from "../AuthLayout";

export function RegistrationFormStep({ 
  formData, 
  errors, 
  loading, 
  onChange, 
  onSubmit 
}) {
  return (
    <form onSubmit={onSubmit}>
      <ErrorMessage message={errors.submit} />

      <FormSection>
        <Input
          label="Full Name"
          placeholder="Enter your full name"
          value={formData.fullName}
          onChange={onChange("fullName")}
          error={errors.fullName}
          required
        />
        
        <Input
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={onChange("email")}
          error={errors.email}
          required
        />
        
        <Input
          label="Password"
          type="password"
          placeholder="Create a password"
          value={formData.password}
          onChange={onChange("password")}
          error={errors.password}
          helperText={!errors.password ? "At least 6 characters" : undefined}
          required
        />
        
        <Input
          label="Confirm Password"
          type="password"
          placeholder="Repeat your password"
          value={formData.confirmPassword}
          onChange={onChange("confirmPassword")}
          error={errors.confirmPassword}
          required
        />
      </FormSection>

      <Checkbox
        id="terms"
        label="I agree to the Terms of Service and Privacy Policy"
        checked={formData.agreeTerms}
        onChange={onChange("agreeTerms")}
        error={errors.agreeTerms}
      />

      <Button type="submit" fullWidth loading={loading} disabled={loading}>
        Create Account
      </Button>
    </form>
  );
}

