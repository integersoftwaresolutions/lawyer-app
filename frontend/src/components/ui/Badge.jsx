export default function Badge({ 
  children, 
  variant = "default",
  size = "md",
  className = "",
  ...props 
}) {
  const baseClasses = "inline-flex items-center justify-center rounded-full font-medium whitespace-nowrap";
  
  const sizeClasses = {
    sm: "py-1 px-2 text-xs",
    md: "py-1.5 px-3 text-xs",
    lg: "py-2 px-4 text-sm",
  };

  const variantClasses = {
    default: "bg-surface text-text-secondary",
    primary: "bg-primary text-primary-text",
    success: "bg-success text-success-text",
    warning: "bg-warning text-warning-text",
    danger: "bg-danger text-danger-text",
    info: "bg-info text-info-text",
  };

  return (
    <span className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
}
