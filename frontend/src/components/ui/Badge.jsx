export default function Badge({ 
  children, 
  variant = "default",
  size = "sm",
  bordered = false,
  className = "",
  ...props 
}) {
  const baseClasses = "inline-flex items-center justify-center rounded-full font-medium whitespace-nowrap";
  
  const sizeClasses = {
    table: "inline-flex items-center h-7 px-2.5 text-[11px] leading-none",
    sm: "py-1 px-2 text-xs",
    md: "py-1.5 px-3 text-xs",
    lg: "py-2 px-4 text-sm",
  };

  const variantClasses = {
    default: "text-text-secondary bg-surface",
    primary: "text-primary bg-primary-light",
    secondary: "text-secondary bg-secondary-light",
    accent: "text-accent bg-accent-light",
    success: "text-success bg-success-light",
    warning: "text-warning bg-warning-light",
    danger: "text-danger bg-danger-light",
    info: "text-info bg-info-light",
  };

  const borderedClasses = {
    default: "border border-border",
    primary: "border border-primary",
    secondary: "border border-secondary",
    accent: "border border-accent",
    success: "border border-success",
    warning: "border border-warning",
    danger: "border border-danger",
    info: "border border-info",
  };

  return (
    <span
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${bordered ? borderedClasses[variant] : ""} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
