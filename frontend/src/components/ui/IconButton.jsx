import Spinner from "./Spinner";
import { getButtonClasses, getIconSize } from "./buttonStyles";

/**
 * Icon-only button with required accessible label.
 */
export default function IconButton({
  icon: Icon,
  label,
  variant = "ghost",
  size = "icon-sm",
  rounded = "md",
  outline = false,
  loading = false,
  disabled = false,
  className = "",
  type = "button",
  ...props
}) {
  if (!Icon) {
    throw new Error("IconButton requires an `icon` prop");
  }

  const iconClass = getIconSize(size === "icon" || size === "icon-sm" || size === "icon-lg" ? size : "icon-sm");
  const classes = getButtonClasses({
    variant,
    size: size === "sm" ? "icon-sm" : size === "lg" ? "icon-lg" : size,
    rounded,
    outline,
    disabled,
    loading,
    className
  });

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-label={label}
      title={label}
      {...props}
    >
      {loading ? <Spinner className={iconClass} /> : <Icon className={iconClass} aria-hidden="true" />}
    </button>
  );
}
