export default function Card({ 
  children, 
  title,
  subtitle,
  headerAction,
  padding = "p-6",
  className = "",
  ...props 
}) {
  return (
    <div className={`border border-card-border rounded-lg bg-card ${padding} ${className}`} {...props}>
      {(title || headerAction) && (
        <div className={`flex justify-between items-center ${title || subtitle ? "mb-4" : ""}`}>
          <div>
            {title && <h3 className="text-lg font-semibold text-card-text m-0">{title}</h3>}
            {subtitle && <p className="text-sm text-text-secondary mt-1">{subtitle}</p>}
          </div>
          {headerAction}
        </div>
      )}
      {children}
    </div>
  );
}
