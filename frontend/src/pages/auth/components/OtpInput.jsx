import { Input } from "../../../components/ui";

export function OtpInput({ value, onChange, error, autoFocus = true }) {
  const handleChange = (e) => {
    const numericValue = e.target.value.replace(/\D/g, "").slice(0, 6);
    onChange(numericValue);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-text-primary mb-2">
        Verification Code
      </label>
      <Input
        type="text"
        inputMode="numeric"
        placeholder="000000"
        value={value}
        onChange={handleChange}
        error={error}
        className="text-center text-2xl tracking-widest font-mono"
        maxLength={6}
        autoFocus={autoFocus}
      />
      <p className="text-xs text-text-secondary mt-2 text-center">
        Enter the 6-digit code sent to your email
      </p>
    </div>
  );
}

