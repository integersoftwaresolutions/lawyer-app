export default function PageHeader({
  title,
  subtitle,
  icon: Icon,
  iconClassName = "bg-primary-light text-primary",
  actions,
  meta,
  size = "default",
  className = ""
}) {
  const isCompact = size === "compact";
  const titleClass = isCompact
    ? "text-base sm:text-lg font-bold text-text-primary leading-tight truncate m-0"
    : "text-xl sm:text-2xl font-bold text-text-primary leading-tight m-0";
  const subtitleClass = isCompact
    ? "text-[11px] text-text-muted truncate hidden sm:block mt-0 mb-0"
    : "text-sm text-text-secondary mt-1 mb-0";
  const iconBoxClass = isCompact
    ? `p-1.5 rounded-lg shrink-0 ${iconClassName}`
    : `p-2 rounded-xl shrink-0 ${iconClassName}`;
  const iconSizeClass = isCompact ? "w-4 h-4 sm:w-5 sm:h-5" : "w-5 h-5";

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 ${className}`}
    >
      <div className="flex items-start gap-3 min-w-0">
        {Icon ? (
          <div className={iconBoxClass}>
            <Icon className={iconSizeClass} />
          </div>
        ) : null}
        <div className="min-w-0">
          <h1 className={titleClass}>{title}</h1>
          {subtitle ? <p className={subtitleClass}>{subtitle}</p> : null}
        </div>
      </div>

      {(actions || meta) ? (
        <div className="flex flex-col gap-2 items-start sm:items-end shrink-0 w-full sm:w-auto">
          {actions ? (
            <div className="flex flex-wrap items-center gap-2 justify-start sm:justify-end">
              {actions}
            </div>
          ) : null}
          {meta ? (
            <div className="flex flex-col gap-1 items-start sm:items-end w-full sm:w-auto">
              {meta}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
