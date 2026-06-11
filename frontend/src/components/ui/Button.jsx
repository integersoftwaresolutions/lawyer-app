import Spinner from "./Spinner";
import { getButtonClasses, getIconSize } from "./buttonStyles";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  rounded = "md",
  outline = false,
  fullWidth = false,
  loading = false,
  disabled = false,
  icon: Icon,
  iconRight: IconRight,
  className = "",
  type = "button",
  ...props
}) {
  const iconClass = getIconSize(size);
  const classes = getButtonClasses({
    variant,
    size,
    rounded,
    outline,
    fullWidth,
    disabled,
    loading,
    className
  });

  return (
    <button type={type} className={classes} disabled={disabled || loading} {...props}>
      {loading ? (
        <Spinner className={iconClass} />
      ) : (
        Icon && <Icon className={`${iconClass} shrink-0`} aria-hidden="true" />
      )}
      {children != null && children !== "" && <span>{children}</span>}
      {!loading && IconRight && (
        <IconRight className={`${iconClass} shrink-0`} aria-hidden="true" />
      )}
    </button>
  );
}
