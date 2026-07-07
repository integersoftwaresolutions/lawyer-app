export default function Badge({ 
  children, 
  variant = "default",
  size = "md",
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
    default: "border border-border text-text-secondary bg-surface",
    primary: "border border-primary text-primary bg-primary-light",
    secondary: "border border-secondary text-secondary bg-secondary-light",
    accent: "border border-accent text-accent bg-accent-light",
    success: "border border-success text-success bg-success-light",
    warning: "border border-warning text-warning bg-warning-light",
    danger: "border border-danger text-danger bg-danger-light",
    info: "border border-info text-info bg-info-light",
  };

  return (
    <span className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
}
