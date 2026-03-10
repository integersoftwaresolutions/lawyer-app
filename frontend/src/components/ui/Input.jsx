export default function Input({ 
  label,
  error,
  helperText,
  fullWidth = true,
  className = "",
  containerClassName = "",
  icon,
  ...props 
}) {
  return (
    <div className={`mb-4 ${containerClassName}`}>
      {label && (
        <label className="block mb-2 text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            {icon}
          </div>
        )}
        <input
          className={`${fullWidth ? "w-full" : ""} py-3 ${icon ? "pl-10 pr-4" : "px-4"} rounded-md border ${
            error ? "border-danger" : "border-input-border"
          } bg-input-background text-input-text text-sm outline-none transition-colors duration-200 focus:border-primary ${className}`}
          {...props}
        />
      </div>
      {(error || helperText) && (
        <p className={`mt-1 text-xs ${error ? "text-danger" : "text-text-muted"}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
}
