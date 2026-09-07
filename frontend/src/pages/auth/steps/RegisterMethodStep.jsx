import { Button } from "../../../components/ui";
import { GoogleAuthButton } from "../components/GoogleAuthButton";
import { AuthDivider } from "../AuthLayout";

export function RegisterMethodStep({ onEmailClick, onGoogleSuccess }) {
  return (
    <>
      
      
      <Button variant="secondary" fullWidth onClick={onEmailClick}>
        Sign up with Email
      </Button>
    </>
  );
}

