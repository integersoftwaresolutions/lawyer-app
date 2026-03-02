export default function Input({ 
  label,
  error,
  helperText,
  fullWidth = true,
  className = "",
  containerClassName = "",
  ...props 
}) {
  return (
    <div className={`mb-4 ${containerClassName}`}>
      {label && (
        <label className="block mb-2 text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <input
        className={`${fullWidth ? "w-full" : ""} py-3 px-4 rounded-md border ${
          error ? "border-danger" : "border-input-border"
        } bg-input-background text-input-text text-sm outline-none transition-colors duration-200 ${className}`}
        {...props}
      />
      {(error || helperText) && (
        <p className={`mt-1 text-xs ${error ? "text-danger" : "text-text-muted"}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
}
