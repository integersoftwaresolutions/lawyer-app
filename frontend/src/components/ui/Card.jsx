export default function Card({ 
  children, 
  title,
  subtitle,
  headerAction,
  padding = "p-4 sm:p-5 md:p-6",
  className = "",
  ...props 
}) {
  return (
    <div className={`border border-card-border rounded-lg bg-card shadow-sm ${padding} ${className}`} {...props}>
      {(title || headerAction) && (
        <div className={`flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-start ${title || subtitle ? "mb-4" : ""}`}>
          <div className="min-w-0">
            {title && <h3 className="text-base sm:text-lg font-semibold text-card-text m-0">{title}</h3>}
            {subtitle && <p className="text-sm text-text-secondary mt-1">{subtitle}</p>}
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
