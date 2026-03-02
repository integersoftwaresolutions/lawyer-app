export default function Button({ 
  children, 
  variant = "primary", 
  size = "md", 
  fullWidth = false,
  loading = false,
  disabled = false,
  className = "",
  ...props 
}) {
  const baseClasses = "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all duration-200 border-none";
  
  const sizeClasses = {
    sm: "py-2 px-4 text-sm",
    md: "py-3 px-6 text-sm",
    lg: "py-4 px-8 text-base",
  };

  const variantClasses = {
    primary: "bg-primary text-primary-text hover:bg-primary-hover",
    secondary: "bg-secondary text-secondary-text border border-secondary-border hover:bg-secondary-hover",
    danger: "bg-danger text-danger-text hover:bg-danger-hover",
    success: "bg-success text-success-text hover:bg-success-hover",
    ghost: "bg-transparent text-text-primary hover:bg-surface",
  };

  const disabledClasses = (disabled || loading) ? "opacity-60 cursor-not-allowed" : "cursor-pointer";
  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${disabledClasses} ${widthClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="mr-2">...</span>}
      {children}
    </button>
  );
}
