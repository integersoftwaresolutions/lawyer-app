import { Button } from "../../../components/ui";
import { GoogleAuthButton } from "../components/GoogleAuthButton";
import { AuthDivider } from "../AuthLayout";

export function RegisterMethodStep({ onEmailClick, onGoogleSuccess }) {
  return (
    <>
      <GoogleAuthButton 
        onSuccess={onGoogleSuccess}
        text="signup_with"
      />
      <AuthDivider text="or continue with email" />
      <Button variant="secondary" fullWidth onClick={onEmailClick}>
        Sign up with Email
      </Button>
    </>
  );
}

