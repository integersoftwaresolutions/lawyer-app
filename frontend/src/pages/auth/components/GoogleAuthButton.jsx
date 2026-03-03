import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useToast } from "../../../hooks/useToast";

export function GoogleAuthButton({ onSuccess, text = "signup_with", disabled = false }) {
  const toast = useToast();

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <GoogleLogin
        onSuccess={onSuccess}
        onError={() => toast.error("Google sign-in failed")}
        text={text}
        theme="filled_black"
        size="large"
        width="100%"
        disabled={disabled}
      />
    </GoogleOAuthProvider>
  );
}

