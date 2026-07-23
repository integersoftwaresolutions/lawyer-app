const sizeClasses = {
  xs: "h-7 px-2.5 text-xs gap-1",
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-11 px-6 text-sm gap-2",
  icon: "h-8 w-8 p-0",
  "icon-sm": "h-7 w-7 p-0",
  "icon-lg": "h-10 w-10 p-0"
};

const roundedClasses = {
  sm: "rounded-md",
  md: "rounded-lg",
  lg: "rounded-xl",
  full: "rounded-full"
};

function solidVariants(outline) {
  if (outline) {
    return {
      primary:
        "border border-primary text-primary bg-primary-light hover:bg-primary-light-hover shadow-sm",
      secondary:
        "border border-secondary text-secondary bg-secondary-light hover:bg-secondary-light-hover shadow-sm",
      accent:
        "border border-accent text-accent bg-accent-light hover:bg-accent-light-hover shadow-sm",
      danger:
        "border border-danger text-danger bg-danger-light hover:bg-danger-light-hover shadow-sm",
      success:
        "border border-success text-success bg-success-light hover:bg-success-light-hover shadow-sm",
      warning:
        "border border-warning text-warning bg-warning-light hover:bg-warning-light-hover shadow-sm",
      info:
        "border border-info text-info bg-info-light hover:bg-info-light-hover shadow-sm",
      ghost:
        "border border-transparent text-text-secondary bg-transparent hover:bg-surface-hover hover:text-text-primary"
    };
  }
  return {
    primary: "border border-transparent bg-primary text-primary-text hover:bg-primary-hover shadow-sm",
    secondary:
      "border border-card-border bg-card text-text-primary hover:bg-surface-hover shadow-sm",
    danger: "border border-transparent bg-danger text-danger-text hover:bg-danger-hover shadow-sm",
    success: "border border-transparent bg-success text-success-text hover:bg-success-hover shadow-sm",
    ghost: "border border-transparent bg-transparent text-text-secondary hover:bg-surface-hover hover:text-text-primary",
    warning: "border border-transparent bg-warning text-warning-text hover:bg-warning-hover shadow-sm"
  };
}

export function getButtonClasses({
  variant = "primary",
  size = "md",
  rounded = "md",
  outline = false,
  fullWidth = false,
  disabled = false,
  loading = false,
  className = ""
}) {
  const variants = solidVariants(outline);
  const variantClass = variants[variant] || variants.primary;
  const isIconOnly = size === "icon" || size === "icon-sm" || size === "icon-lg";

  return [
    "inline-flex items-center justify-center font-medium transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
    "select-none",
    isIconOnly ? sizeClasses[size] : sizeClasses[size] || sizeClasses.md,
    roundedClasses[rounded] || roundedClasses.md,
    variantClass,
    fullWidth ? "w-full" : "",
    disabled || loading ? "opacity-50 cursor-not-allowed pointer-events-none" : "cursor-pointer active:scale-[0.98]",
    className
  ]
    .filter(Boolean)
    .join(" ");
}

export function getIconSize(size) {
  if (size === "xs" || size === "sm" || size === "icon-sm") return "w-3.5 h-3.5";
  if (size === "lg" || size === "icon-lg") return "w-5 h-5";
  return "w-4 h-4";
}
